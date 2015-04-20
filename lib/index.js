'use strict';

var O = require('ose').module(module);
O.package = 'ose-pa';
O.scope = 'control';

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
 * defined by this package to the `"control"` [scope].
 *
 * @class pa.lib
 * @type singleton
 */

// Public {{{1
exports.browserConfig = true;

exports.config = function(name, data, deps) {
  O.kind('./dbus', 'paDbus', deps);
//  O.kind('./stream', 'paStream', deps);

  O.content('../content');
};
