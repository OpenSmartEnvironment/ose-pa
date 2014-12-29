'use strict';

exports = require('ose')
  .singleton(module, 'ose/lib/http/content')
  .exports
;

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
exports.addFiles = function() {
  this.addModule('lib/index');
  this.addModule('lib/dbus/index');
  this.addModule('lib/dbus/bb/detail');
  this.addModule('lib/stream/index');
  this.addModule('lib/stream/bb/listDetail');
};

