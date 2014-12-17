'use strict';

var Ose = require('ose');

// Public {{{1
exports.displayLayout = function() {  // {{{2
  this.$().append([
    $('<p>').text(this.entry.getCaption()),
    this.slider('volume', {
      change: Ose._.throttle(onVolume.bind(this), 50)
    })
  ]);

  this.$().find('button').on('click', onMute.bind(this));
};

exports.updateState = function(state) {  // {{{2
  for (var key in state) {
    switch (key) {
      case 'max':
	this.slider('volume', {
	  max: state[key],
	  value: state.volume
	});
        break;
      case 'volume':
        this.slider('volume', state[key]);
        break;
      case 'mute':
	if (state.mute) {
	  this.$('volume').addClass('disabled')
	} else {
	  this.$('volume').removeClass('disabled');
	}
	break;
    }
  }

};

// }}}1
// Event Handlers {{{1
function onMute(ev) {  // {{{2
  if (! this.updatingState) {
    this.entry.sendAction({mute: ! this.entry.state.mute});
  }
  return false;
}

function onVolume(ev, isTriggered) {  // {{{2
  if (this.updatingState || isTriggered) return false;

  this.entry.sendAction({volume: this.controlVal('volume') / this.entry.state.max});

  if (ev.gesture) ev.gesture.preventDefault();
  ev.preventDefault();

  return false;
}

// }}}1
