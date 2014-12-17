#!/usr/bin/env python3

import os, sys
from os import path

import gi
from gi.repository import GObject, GLib, Gio

import json

import dbus
from dbus.mainloop.glib import DBusGMainLoop

from datetime import datetime, timedelta

GObject.threads_init()

#def quack(value):
#    sys.stderr.write(repr(value) + '\n')

class Player(object):
    def __init__(self):
        # Listen for commands on stdin.
        self.input = Gio.UnixInputStream.new(0, False)
        self.cancellable = Gio.Cancellable()
        self.input.read_bytes_async(16384, 0, self.cancellable, self.on_stdin_bytes, None)
        self.prepare_dbus()

    def run(self):
        self.last_ping = datetime.now()
        GLib.timeout_add_seconds(60, self.timeout_handler)

        self.mainloop = GLib.MainLoop(None)
        self.mainloop.run()

    def timeout_handler(self):
        if (self.last_ping + timedelta(seconds=120)) < datetime.now():
            self.mainloop.quit()
        else:
            GLib.timeout_add_seconds(60, self.timeout_handler)

    def prepare_dbus(self):
        DBusGMainLoop(set_as_default=True)

        self.bus = self.get_bus()
        self.core1 = self.bus.get_object(object_path='/org/pulseaudio/core1')
        self.sinks = self.core1.Get('org.PulseAudio.Core1', 'Sinks', dbus_interface='org.freedesktop.DBus.Properties')
        self.sink0 = self.bus.get_object(object_path=self.sinks[0])
 
        self.playback_streams = self.core1.Get('org.PulseAudio.Core1', 'PlaybackStreams', dbus_interface='org.freedesktop.DBus.Properties')

        for path in self.playback_streams:
            stream = self.bus.get_object(object_path=str(path))
            property_list = stream.Get('org.PulseAudio.Core1.Stream', 'PropertyList', dbus_interface='org.freedesktop.DBus.Properties')
            pid = ''.join([chr(char) for char in dict(property_list)['application.process.id'][:-1]])
            binary = ''.join([chr(char) for char in dict(property_list)['application.process.binary'][:-1]])
            name = ''.join([chr(char) for char in dict(property_list)['application.name'][:-1]])
            volume = int(stream.Get('org.PulseAudio.Core1.Stream', 'Volume', dbus_interface='org.freedesktop.DBus.Properties')[0])
            mute = bool(stream.Get('org.PulseAudio.Core1.Stream', 'Mute', dbus_interface='org.freedesktop.DBus.Properties'))
            base_volume = int(self.sink0.Get('org.PulseAudio.Core1.Device', 'BaseVolume', dbus_interface='org.freedesktop.DBus.Properties'))

            print(json.dumps({
                'newStream': {
                    'pid': pid,
                    'path': str(path),
                    'name': name,
                    'binary': binary,
                }
            }))

            print(json.dumps({
                'streamVolume': {
                    'path': str(path),
                    'volume': volume,
                    'max': base_volume
                 }
            }))

            print(json.dumps({
                'streamMute': {
                    'path': str(path),
                    'mute': mute,
                 }
            }))

            for sig_name, sig_handler in (
                ('MuteUpdated', self.stream_mute_updated),
                ('VolumeUpdated', self.stream_volume_updated),
            ):
                stream.connect_to_signal(sig_name, sig_handler, path_keyword='sender')

                self.core1.ListenForSignal(
                    'org.PulseAudio.Core1.Stream.' + sig_name,
                    dbus.Array(signature='o')
                )

            #quack(property_list.keys())

        self.return_data()

        # Notes:
        # self.sink0.Introspect(dbus_interface='org.freedesktop.DBus.Introspectable')
        # self.core1.Get('org.PulseAudio.Core1.Device', 'Name', dbus_interface='org.freedesktop.DBus.Properties')

        #name = self.sink0.Get('org.PulseAudio.Core1.Device', 'Name', dbus_interface='org.freedesktop.DBus.Properties')

        for sig_name, sig_handler in (
            ('MuteUpdated', self.mute_updated),
            ('VolumeUpdated', self.volume_updated),
            #('DeviceUpdated', self.device_updated),
            #('StateUpdated', self.state_updated),
            #('ActivePortUpdated', self.active_port_updated),
            #('PropertyListUpdated', self.property_list_updated),
        ):
            #self.bus.add_signal_receiver(sig_handler, sig_name)
            self.sink0.connect_to_signal(sig_name, sig_handler, path_keyword='sender')
            self.core1.ListenForSignal(
                'org.PulseAudio.Core1.Device.' + sig_name,
                dbus.Array([self.sinks[0]], signature='o')
                #dbus.Array(['/org/pulseaudio/core1/sink0'], signature='o')
            )

        for sig_name, sig_handler in (
            ('NewPlaybackStream', self.new_playback_stream),
            ('PlaybackStreamRemoved', self.playback_stream_removed),
            ('NewSink', self.playback_stream_removed)
        ):
            self.bus.add_signal_receiver(sig_handler, sig_name)
            self.core1.ListenForSignal(
                'org.PulseAudio.Core1.{}'.format(sig_name),
                dbus.Array(signature='o')
            )

        self.run()

    def get_bus(self):
        srv_addr = self.get_bus_address()

        # Note:
        # dbus.connection.Connection(srv_addr)\
        # .get_object(object_path='/org/pulseaudio/core1')\
        # .Introspect(dbus_interface='org.freedesktop.DBus.Introspectable')

        return dbus.connection.Connection(srv_addr)

    def get_bus_address(self):
        srv_addr = os.environ.get('PULSE_DBUS_SERVER')
        if not srv_addr and os.access('/run/pulse/dbus-socket', os.R_OK | os.W_OK):
            # Well-known system-wide daemon socket
            srv_addr = 'unix:path=/run/pulse/dbus-socket'
        if not srv_addr:
            srv_addr = dbus.SessionBus().get_object(
                'org.PulseAudio1', '/org/pulseaudio/server_lookup1')\
                 .Get('org.PulseAudio.ServerLookup1',
                     'Address', dbus_interface='org.freedesktop.DBus.Properties')
        return srv_addr

    def return_data(self):
        print(json.dumps({\
            'baseVolume': int(self.sink0.Get('org.PulseAudio.Core1.Device', 'BaseVolume', dbus_interface='org.freedesktop.DBus.Properties')),
            'volumeSteps': int(self.sink0.Get('org.PulseAudio.Core1.Device', 'VolumeSteps', dbus_interface='org.freedesktop.DBus.Properties')),
            'volume': int(self.sink0.Get('org.PulseAudio.Core1.Device', 'Volume', dbus_interface='org.freedesktop.DBus.Properties')[0]),
            'mute': int(self.sink0.Get('org.PulseAudio.Core1.Device', 'Mute', dbus_interface='org.freedesktop.DBus.Properties'))
        }))

    def new_playback_stream(self, path):
        stream = self.bus.get_object(object_path=str(path))
        property_list = stream.Get('org.PulseAudio.Core1.Stream', 'PropertyList', dbus_interface='org.freedesktop.DBus.Properties')
        pid = ''.join([chr(char) for char in dict(property_list)['application.process.id'][:-1]])
        binary = ''.join([chr(char) for char in dict(property_list)['application.process.binary'][:-1]])
        name = ''.join([chr(char) for char in dict(property_list)['application.name'][:-1]])
        volume = int(stream.Get('org.PulseAudio.Core1.Stream', 'Volume', dbus_interface='org.freedesktop.DBus.Properties')[0])
        mute = bool(stream.Get('org.PulseAudio.Core1.Stream', 'Mute', dbus_interface='org.freedesktop.DBus.Properties'))
        base_volume = int(self.sink0.Get('org.PulseAudio.Core1.Device', 'BaseVolume', dbus_interface='org.freedesktop.DBus.Properties'))

        print(json.dumps({
            'newStream': {
                'pid': pid,
                'path': str(path),
                'name': name,
                'binary': binary,
            }
        }))

        print(json.dumps({
            'streamVolume': {
                'path': str(path),
                'volume': volume,
                'max': base_volume
             }
        }))

        print(json.dumps({
            'streamMute': {
                'path': str(path),
                'mute': mute,
            }
        }))

    def playback_stream_removed(self, path):
        print(json.dumps({'streamRemoved': str(path)}))

    def new_sink(self, path):
        print(json.dumps({'newSink': str(path)}))

    def mute_updated(self, dbusBoolean, sender):
        print(json.dumps({'mute': bool(dbusBoolean)}))

    def volume_updated(self, dbusArray, sender):
        print(json.dumps({
            'volume': int(dbusArray[0]) or 0
        }))

#    def device_updated(self, dbusArray, sender):
#        quack('******** device_updated ********')
#        return None
#
#    def state_updated(self, dbusArray, sender):
#        quack('******** state_updated ********')
#        return None
#
#    def active_port_updated(self, dbusArray):
#        quack('******** active_port_updated ********')
#        return None
#
#    def property_list_updated(self, dbusArray):
#        quack('******** property_list_updated ********')
#        return None
#
    def stream_volume_updated(self, dbusArray, sender):
        print(json.dumps({
            'streamVolume': {
                'path': str(sender),
                'volume': int(dbusArray[0])
            }
        }))

    def stream_mute_updated(self, dbusBoolean, sender):
        print(json.dumps({
            'streamMute': {
                'path': str(sender),
                'mute': bool(dbusBoolean)
            }
        }))

    def get_mute(self, mute):
        return None

    def get_volume(self):
        return None

    def set_mute(self, mute):
        self.sink0.Set('org.PulseAudio.Core1.Device',
            'Mute', mute, dbus_interface='org.freedesktop.DBus.Properties')

    def set_volume(self, volume):
        self.sink0.Set('org.PulseAudio.Core1.Device',
             'Volume', [dbus.UInt32(volume)], dbus_interface='org.freedesktop.DBus.Properties')

    def set_stream_mute(self, data):
        stream = self.bus.get_object(object_path=data['path'])
        stream.Set('org.PulseAudio.Core1.Stream', 'Mute', data['mute'], dbus_interface='org.freedesktop.DBus.Properties')

    def set_stream_volume(self, data):
        stream = self.bus.get_object(object_path=data['path'])
        stream.Set('org.PulseAudio.Core1.Stream', 'Volume', [dbus.UInt32(data['volume'])], dbus_interface='org.freedesktop.DBus.Properties')

    def on_stdin_bytes(self, source, result, data):
        finish = self.input.read_bytes_finish(result)

        if finish == 0:
#            quack('******** COMMIT SUICIDE ********')
            self.mainloop.quit()
            return
        elif finish == -1:
#            quack('******** ERROR ********')
            self.mainloop.quit()
        else:
            # TODO: Merge more inputs before parsing.
            data = filter(None, str(finish.get_data(), encoding='utf8').split('\n'))

            for text in data:
                try:
                    obj = json.loads(text)
                except:
                    print('ERROR PARSING: ', text, file=sys.stderr)

                for key in obj.keys():
                    if key == 'ping':
                        self.last_ping = datetime.now()
                        print(json.dumps({'pong': 1}))

                    elif key == 'mute':
                        self.set_mute(obj[key])

                    elif key == 'volume':
                        self.set_volume(obj[key])

                    elif key == 'streamMute':
                        self.set_stream_mute(obj[key])

                    elif key == 'streamVolume':
                        self.set_stream_volume(obj[key])

            self.input.read_bytes_async(16384, 0, self.cancellable, self.on_stdin_bytes, None)

p = Player()
p.run()
