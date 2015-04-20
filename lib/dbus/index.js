'use strict';

var O = require('ose').object(module, 'ose/lib/kind');
exports = O.append('node').exports;

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
 * interface.
 *
 * @class pa.lib.dbus
 * @extend ose.lib.kind
 * @type singleton
 */
