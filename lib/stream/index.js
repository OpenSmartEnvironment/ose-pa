// OBSOLETE

'use strict';

var O = require('ose').object(module, 'ose/lib/kind');
exports = O.exports;

/* CHECK {{{1  TODO

var Actions = {};

Actions.mute = function(that, action, cb) {  // {{{2
  var mute = action.data;

  switch (mute) {
    case 0:
      mute = false;
      break;
    case 1:
      mute = true;
      break;
    case 'toggle':
      mute = ! that.state.mute;
      break;
  }

  if (typeof mute === 'boolean') {
    that.action(
      'streamMute',
      {
	path: that.data.path,
	mute: mute
      },
      that.master,
      cb
    );
  } else {
    cb('invalidValue');
  }
};

Actions.volume = function(that, action, cb) {  // {{{2
  var volume = action.data;

  switch (volume) {
    case 'down':
      volume = that.state.volume / that.state.max - 0.01;
      if (volume < 0) volume = 0;

      break;
    case 'up':
      volume = that.state.volume / that.state.max + 0.01;
      if (volume > 1) volume = 1;

      break;
  }

  if (typeof volume !== 'number') {
    volume = parseFloat(volume);
  }

  if (isNaN(volume) || (volume < 0) || (volume > 100)) {
    cb('invalidValue');
  } else {
    that.action(
      'streamVolume',
      {
	path: that.data.path,
	volume: Math.floor(volume * that.master.state.max)
      },
      that.master,
      cb
    );
  }
};

// }}}1
*/
