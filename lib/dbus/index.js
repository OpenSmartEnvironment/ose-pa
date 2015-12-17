'use strict';

var O = require('ose').object(module, 'ose/lib/kind');
O.prepend('node');
exports = O.init('control', 'paDbus');

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
 * @kind paDbus
 * @class pa.lib.dbus
 * @extend ose.lib.kind
 * @type singleton
 */
