'use strict';

var Ose = require('ose');
var M = Ose.package(module);
exports = M.init();

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

M.content();

M.scope = 'control';
M.kind('./dbus', 'paDbus');
M.kind('./stream', 'paStream');
