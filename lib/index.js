'use strict';

var Ose = require('ose');
var M = Ose.package(module);
exports = M.init();

/** Docs {{{1
 * @caption Open Smart Environment PulseAudio package
 *
 * @readme
 * This package implements volume control for the [OSE Media player].
 *
 * @module pa
 * @main pa
 */

/**
 * @caption OSE PulseAudio core
 *
 * @readme
 * Core singleton of ose-pa npm package. Registers [entry kinds]
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
