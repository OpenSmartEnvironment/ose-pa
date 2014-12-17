'use strict';

var Ose = require('ose');
var M = Ose.module(module);

var Process = require('child_process');
var Path = require('path');
var Es = require('event-stream');

// Public {{{1
exports.homeInit = function(entry) {  // {{{2
  connect(entry);
};

// }}}1
// Event Handlers {{{1
function onError(pid, data) {  // {{{2
  M.log.error('PULSE ERROR', data);

  if (this.child && (this.child.pid === pid)) {
    connect(this);
  }
};

function onExit(pid, data) {  // {{{2
  M.log.warning('PULSE EXIT', data);

  if (this.child && (this.child.pid === pid)) {
    connect(this);
  }
};

function onStdout(pid, data) {  // {{{2
  if (this.child && (this.child.pid === pid)) {
    for (var key in data) {
      switch (key) {
      case 'pong':
        this.lastPong = new Date().getTime();
        break;
      case 'baseVolume':
        this.setState({'max': data[key]});
        break;
      case 'volumeSteps':
        this.setState({'volumeSteps': data[key]});
        break;
      case 'mute':
        this.setState({'mute': Boolean(data[key])});
        break;
      case 'volume':
        this.setState({'volume': data[key]});
        break;
      case 'newStream':
        newStream(this, data[key]);

        break;
      case 'streamRemoved':
        this.shard.get(data[key].match(/(playback_stream\d*)/g)[0], removeStreamEntry);
        // this.setState({'streamRemoved': data[key]});p
        break;
      case 'streamVolume':
        this.shard.get(data[key].path.match(/(playback_stream\d*)/g)[0], forwardStreamVolume.bind(this, data[key]));
        break;
      case 'streamMute':
        this.shard.get(data[key].path.match(/(playback_stream\d*)/g)[0], forwardStreamMute.bind(this, Boolean(data[key])));
        break;
      default:
        M.log.unhandled('Unhandled Pulse data', data);
      }
    }
  }
};

function removeStreamEntry(err, entry) {  // {{{2
  if (err) {
    M.log.unhandled('Can\'t remove stream.', err);
  } else {
    entry.remove();
  }
};

// TODO: Generalize forwarding of states to entry.
function forwardStreamVolume(data, err, entry) {  // {{{2
  if (err) {
    M.log.unhandled(err);
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
    M.log.unhandled(err);
  } else {
    entry.setState({
      'mute': data.mute
    });
  }
};

function onStderr(pid, data) {  // {{{2
  M.log.notice('PULSE ERR', data);

  if (this.child && (this.child.pid === pid)) {
    connect(this);
  }
};

// }}}1
exports.commands = {};  // {{{1
exports.commands.mute = function(value) {  // {{{2
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

  send(this.entry, {mute: value});
};

exports.commands.volume = function(value, socket) {  // {{{2
/**
 * [Command handler] set volume to specified level.
 *
 * @param value {Number | String} Number between 0..1 | "down" | "up"
 *
 * @method volume
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
    (typeof value === 'number') &&
    (value >= 0) &&
    (value <= 1)
  ) {
    value = Math.round(value * e.state.max);

    send(e, {volume: Math.floor(value)});
  } else {
    M.log.warning('Invalid value, should be: (0 <= value <= 1)', value); // TODO: Answer to socket.
  }
};

/*
exports.commands.streamMute = function(that, action, cb) {  // {{{2
  send(that, {
    streamMute: {
      path: action.data.path,
      mute: Boolean(action.data.mute)
    }
  });

  cb();
};

exports.commands.streamVolume = function(that, action, cb) {  // {{{2
  send(that, {
    streamVolume: {
      path: action.data.path,
      volume: action.data.volume
    }
  });

  cb();
};
*/
// }}}1
// Private {{{1
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
      M.log.unhandled('Unknown error', err);
    }
  });
};

function connect(that) {  // {{{2
  if (that.pingTimer) {  // Clean ping timer. {{{3
    clearInterval(that.pingTimer);
    delete that.pingTimer;
  }

  if (that.child) {  // Clean old child. {{{3
    M.log.notice('Closing old child.');
    console.trace();

//    that.child.removeAllListeners();
//    that.child.on('error', Ose.dummyFn);
    that.child.kill();
    that.child.disconnect && that.child.disconnect();
    delete that.child;
  }

  if (that.connectHandle) {  // Check last connection and setup connection timeout if necessary {{{3
    clearTimeout(that.connectHandle);
  } else {
    var now = new Date().getTime();

    if (
      that.lastConnect &&
      (that.lastConnect + that.connectTimeout + 1000 > now)
    ) {
      that.connectTimeout += 1000;

      if (that.connectTimeout > 60000) {
        that.connectTimeout = 60000;
      }
    } else {
      that.connectTimeout = 10;
    }

    that.lastConnect = now;
  }

  that.connectHandle = setTimeout(function() {  // Timeout connection by that.connectTimeout {{{3
    delete that.connectHandle;

    M.log.notice('Connecting to new child.');

    that.child = Process.spawn('python3', ['-u', Path.dirname(module.filename) + '/child.py']);
    that.child.on('exit', onExit.bind(that, that.child.pid));
    that.child.on('error', onError.bind(that, that.child.pid));

    Es.pipeline(
      that.child.stdout,
      Es.split(),
      Es.parse(),
      Es.map(onStdout.bind(that, that.child.pid))
    );

    that.child.stderr.setEncoding('utf8');
    that.child.stderr.on('data', onStderr.bind(that, that.child.pid));

    that.lastPong = new Date().getTime();
    that.pingTimer = setInterval(function() {
      if ((new Date().getTime() - that.lastPong) > 120000) {
        connect(that);
      }
      send(that, {ping: 1})
    }, 60000);

    M.log.debug('Spawning new child');
  }, that.connectTimeout);

  // }}}3
};

function send(that, data) {  // {{{2
  if (that.child) {
    that.child.stdin.write(JSON.stringify(data) + '\n');
  } else {
    M.log.unhandled('Pulse send error', that.identify);
  }
}

// }}}1
