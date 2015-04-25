'use strict';

var O = require('ose').module(module);

var Fs = require('fs');
var Dbus = require('dbus-native');

/** Docs {{{1
 * @module pa
 */

/**
 * PulseAudio control over D-Bus
 *
 * @class pa.lib.dbus
 */


// Public {{{1
exports.homeInit = function(entry) {  // {{{2
  readAddress(entry);
};

// }}}1
// Event Handlers {{{1
function muteUpdated(value) {  // {{{2
  this.setState({mute: value});
};

function volumeUpdated(value) {  // {{{2
  this.setState({volume: value[0]});
};

// }}}1
exports.commands = {};  // {{{1
/**
 * Command handlers
 *
 * @property commands
 * @type Object
 */

exports.commands.mute = function(value, socket) {  // {{{2
/**
 * Mute command handler
 *
 * @param value {Boolean|String} True, false or 'toggle'
 * @param socket {Object} Client socket
 *
 * @method mute
 * @handler
 */

  switch (value) {
  case true:
  case false:
    break;
  case 'toggle':
    value = ! this.entry.state.mute;
    break;
  default:
    value = Boolean(value);
  }

  this.entry.sink.Mute = value;

  O.link.close(socket);
};

exports.commands.volume = function(value, socket) {  // {{{2
/**
 * Set volume to specified level.
 *
 * @param value {Number | String} Number between 0..1 | "down" | "up"
 * @param socket {Object} Client socket
 *
 * @method volume
 * @handler
 */

  var e = this.entry;

  switch (value) {
  case 'down':
    value = e.state.value + 0.01;
    if (value < 0) value = 0;

    break;
  case 'up':
    value = Math.round(e.state.value + e.state.max * 0.01);
    if (value > e.state.max) {
      value = e.state.max;
    }

    break;
  }

  if (typeof value === 'string') {
    value = parseFloat(value);
  }

  if (
    (typeof value !== 'number') ||
    (value > 1) ||
    (value < 0)
  ) {
    O.link.error(socket, O.error(this.entry, 'Invalid "volume" command value, should be: (0 <= value <= 1)', value));
    return;
  }

  value = Math.round(value * e.state.max);

  e.bus.invoke({
    destination: 'org.PulseAudio.Core1',
    path: '/org/pulseaudio/core1/sink0',
    interface: 'org.freedesktop.DBus.Properties',
    member: 'Set',
    signature: 'ssv',
    body: ['org.PulseAudio.Core1.Device', 'Volume', ['au', [[value, value]]]]
  }, O.link.bind(socket));
  return;
};

// }}}1
// Private {{{1
function readAddress(entry) {  // {{{2
  if (process.env['PULSE_DBUS_SERVER']) {
    openBus(entry, process.env['PULSE_DBUS_SERVER']);
    return;
  }

  Fs.stat('/run/pulse/dbus-socket', function(err, stat) {
    if (stat && stat.isSocket()) {
      openBus(entry, '/run/pulse/dbus-socket');
      return;
    }

    try {
      var bus = Dbus.sessionBus();
    } catch (err) {
      reconnect(entry, err, 10000);
      return;
    }

    bus.invoke({
      destination: 'org.PulseAudio1',
      path: '/org/pulseaudio/server_lookup1',
      interface: 'org.freedesktop.DBus.Properties',
      member: 'Get',
      signature: 'ss',
      body: ['org.PulseAudio.ServerLookup1', 'Address'],
    }, function(err, address) {
      if (err) {
        reconnect(entry, err, 10000);
        return;
      }

      openBus(entry, address[1][0]);
      return;
    });
    return;
  });
  return;
}

function reconnect(entry, err, timeout) {  // {{{2
  if (err) {
    O.log.suppressError(err, entry, 'Unable to connect to PulseAudio D-Bus socket', 3);
  }

  setTimeout(readAddress.bind(null, entry), timeout);
}

function openBus(entry, address) {  // {{{2
  if (! O.log.isSuppressed(entry, null, 3)) {
    O.log.notice('Openning PulseAudio D-Bus socket', address);
  }

  try {
    entry.bus = Dbus.createClient({busAddress: address, direct: true});
  } catch (err) {
    reconnect(entry, err, 10000);
    return;
  }

  var svc;

  entry.bus.connection.on('error', function(err) {
    reconnect(entry, err, 10000);
  });

  entry.bus.connection.once('connect', function() {
    O.log.liftSuppress(entry);

    svc = entry.bus.getService('org.PulseAudio.Core1');
    svc.getInterface('/org/pulseaudio/core1', 'org.freedesktop.DBus.Properties', onProps);
  });

  function onProps(err, iface) {
    if (err) {
      O.log.error(err);
    } else {
      iface.Get('org.PulseAudio.Core1', 'Sinks', onSinks);
    }
  };

  function onSinks(err, data) {  // {{{3
    if (err) {
      O.log.error(err);
      return;
    }

    entry.sinkName = data[1][0][0];

    svc.getInterface(entry.sinkName, 'org.freedesktop.DBus.Properties', onSinkProps);
    svc.getInterface(entry.sinkName, 'org.PulseAudio.Core1.Device', onSink);

    svc.getInterface('/org/pulseaudio/core1', 'org.PulseAudio.Core1', onCore);
  }

  function onCore(err, iface) {
    if (err) {
      O.log.error(err);
      return;
    }

    iface.ListenForSignal('org.PulseAudio.Core1.Device.MuteUpdated', [entry.sinkName]);
    iface.ListenForSignal('org.PulseAudio.Core1.Device.VolumeUpdated', [entry.sinkName]);

    O.log.notice('PulseAudio D-Bus socket opened', address);
  }

  function onSinkProps(err, iface) {  // {{{3
    if (err) {
      O.log.error(err);
      return;
    }

    entry.sinkProps = iface;
    iface.Get('org.PulseAudio.Core1.Device', 'BaseVolume', onBaseVolume);
    iface.Get('org.PulseAudio.Core1.Device', 'VolumeSteps', onVolumeSteps);
    iface.Get('org.PulseAudio.Core1.Device', 'Mute', onMute);
    iface.Get('org.PulseAudio.Core1.Device', 'Volume', onVolume);
  }

  function onSink(err, iface) {  // {{{3
    if (err) {
      O.log.error(err);
      return;
    }

    entry.sink = iface;
    iface.on('MuteUpdated', muteUpdated.bind(entry));
    iface.on('VolumeUpdated', volumeUpdated.bind(entry));
  }

  function onMute(err, data) {  // {{{3
    if (err) {
      O.log.error(entry, err);
    } else {
      muteUpdated.call(entry, data[1][0]);
    }
  }

  function onVolume(err, data) {  // {{{3
    if (err) {
      O.log.error(entry, err);
    } else {
      volumeUpdated.call(entry, data[1][0]);
    }
  }

  function onVolumeSteps(err, data) {  // {{{3
    if (err) {
      O.log.error(entry, err);
    } else {
      entry.setState({steps: data[1][0]});
    }
  }

  function onBaseVolume(err, data) {  // {{{3
    if (err) {
      O.log.error(entry, err);
    } else {
      entry.setState({max: data[1][0]});
    }
  }

  // }}}3
}

// }}}1




/* STREAMS {{{1
function removeStreamEntry(err, entry) {  // {{{2
  if (err) {
    O.log.unhandled('Can\'t remove stream.', err);
  } else {
    entry.remove();
  }
};

// TODO: Generalize forwarding of states to entry.
function forwardStreamVolume(data, err, entry) {  // {{{2
  if (err) {
    O.log.unhandled(err);
  } else {
    entry.setState({
      'path': data.path,
      'volume': data.volume,
      'max': data.max
    });
  }
};

function forwardStreamMute(data, err, entry) {  // {{{2
  if (err) {
    O.log.unhandled(err);
  } else {
    entry.setState({
      'mute': data.mute
    });
  }
};

function newStream(that, data) {  // {{{2
  var id = data.path.match(/(playback_stream\d*)/g)[0];

  that.shard.get(id, function(err, entry) {
    switch (err && err.code) {
    case undefined:
    case null:
      entry.data = {
        pid: data.pid,
        binary: data.binary,
        path: data.path,
        name: data.name
      };

      break;
    case 'ENTRY_NOT_FOUND':
      entry = that.shard.entry(id, 'paStream', {
        pid: data.pid,
        binary: data.binary,
        path: data.path,
        name: data.name
      });

      break;
    default:
      O.log.unhandled('Unknown error', err);
    }
  });
};

}}}1*/
