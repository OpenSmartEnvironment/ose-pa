'use strict';

var Ose = require('ose');
var M = Ose.module(module);

var List = M.class('ose-bb/lib/pagelet/list');

// Public {{{1
exports.tapDiscard = null;

exports.profile = {  // {{{2
  name: {
    place: 'caption',
    required: true
  }
};

exports.displayLayout = function() {  // {{{2
  this.$('list').append(this.printVolume());

  this.streams = new List(this.page);

  this.streams.display(
    {
      scope: 'control',
      kind: 'paStream'
    },
    null,
    this.$(),
    null
  );
};

exports.updateState = function(state) {  // {{{2
  for (var key in state) {
    switch (key) {
      case 'volumeSteps':
        break;
      case 'max':
        this.slider('volume', {
          max: state.max,
          value: state.volume
        });
        break;
      case 'volume':
        this.slider('volume', state.volume);
        break;
      case 'mute':
        this.slider('volume', {toggle: state.mute});
        break;
      default:
        throw new Error('Unknown state key: ' + key);
    }
  }
};

exports.printVolume = function() {  // {{{2
  var li = $('<li>').append([
    $('<p>').text('Volume'),
    this.slider('volume', {
      change: Ose._.throttle(onVolume.bind(this), 50),
      toggle: onMute.bind(this)
    })
  ]);

  return li;
};

// }}}1
// Private {{{1
function onMute(ev) {  // {{{2
  if (! this.updatingState) {
    this.entry.sendAction({mute: ! this.entry.state.mute});
  }

  return false;
};

function onVolume(ev, isTriggered) {  // {{{2
  if (this.updatingState || isTriggered) return false;

  this.entry.sendAction({volume: this.controlVal('volume') / this.entry.state.max});

  if (ev.gesture) ev.gesture.preventDefault();
  ev.preventDefault();
  return false;
};

// }}}1
