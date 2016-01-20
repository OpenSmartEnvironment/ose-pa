'use strict';

const O = require('ose')(module)
  .singleton(init, 'ose/lib/http/content')
;

exports = O.init();

/** Docs  {{{1
 * @module pa
 */

/**
 * @caption PulseAudio content
 *
 * @readme
 * Provides files of [ose-pa] package to the browser.
 *
 * @class pa.content
 * @type singleton
 * @extends ose.lib.http.content
 */

// Public {{{1
function init() {
  O.super.call(this);

  this.addModule('lib/index');
  this.addModule('lib/dbus/index');
  this.addModule('lib/stream/index');
};
