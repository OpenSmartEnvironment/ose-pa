'use strict';

const O = require('ose')(module)
  .singleton('ose/lib/kind')
  .prepend('node')
;

exports = O.init('control', 'paDbus');

exports.role = ['volume'];

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
 * @schema control
 * @class pa.lib.dbus
 * @extend ose.lib.kind
 * @type singleton
 */
