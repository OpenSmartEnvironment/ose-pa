'use strict';

const O = require('ose')(module)
  .setPackage('ose-pa')
;

/** Docs {{{1
 * @caption PulseAudio
 *
 * @readme
 * This package implements volume control for the [Media player].
 *
 * See [Media player example].
 *
 * @module pa
 * @main pa
 */

/**
 * @caption PulseAudio core
 *
 * @readme
 * Core singleton of [ose-pa] npm package. Registers [entry kinds]
 * defined by this package to the `"control"` [schema].
 *
 * @class pa.lib
 * @type singleton
 */

// Public {{{1
exports.browserConfig = true;

exports.config = function(name, val, deps) {
  require('./dbus');

  O.content('../content');
};

