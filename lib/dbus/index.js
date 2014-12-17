'use strict';

var Ose = require('ose');
var M = Ose.singleton(module, 'ose/lib/kind');
exports = M.append('node').exports;

/** Docs {{{1
 * @module pa
 */

/**
 * @caption PulseAudio control kind
 *
 * @readme
 * [Entry kind] for PulseAudio instances
 *
 * Each entry communicates with PulseAudio via its D-Bus
 * interface. This functionality is currently implemented in a Python
 * child process.
 *
 * @class pa.lib.dbus
 * @extend ose.lib.kind
 * @type singleton
 */
