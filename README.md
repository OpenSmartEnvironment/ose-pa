# Open Smart Environment PulseAudio package

This package implements volume control for the [OSE Media player](http://opensmartenvironment.github.io/doc/modules/media.html).

See [bundle.media](http://opensmartenvironment.github.io/doc/modules/bundle.media.html) example application

## Status
- Pre-alpha stage (insecure and buggy)
- Unstable API
- Gaps in the documentation
- No test suite

This is not yet a piece of download-and-use software. Its important
to understand the basic principles covered by the
[documentation](http://opensmartenvironment.github.io/doc/).

Use of this software is currently recommended only for users that
wish participate in the development process, see
[Contributions](#contributions).

## Getting started
To get started with OSE, refer to the [ose-bundle](http://opensmartenvironment.github.io/doc/modules/bundle.html) package and
[Media player example application](http://opensmartenvironment.github.io/doc/modules/bundle.media.html). You can read the entire OSE
documentation [here]( http://opensmartenvironment.github.io/doc).

## Modules
Open Smart Environment PulseAudio package consists of the following modules:
- PulseAudio control kind
- OSE PulseAudio core
- OSE PulseAudio content

### PulseAudio control kind
[Entry kind](http://opensmartenvironment.github.io/doc/classes/ose.lib.kind.html) for PulseAudio instances

Each entry communicates with PulseAudio via its D-Bus
interface. This functionality is currently implemented in a Python
child process.

Module [PulseAudio control kind](http://opensmartenvironment.github.io/doc/classes/pa.lib.dbus.html) reference ... 

### OSE PulseAudio core
Core singleton of ose-pa npm package. Registers [entry kinds](http://opensmartenvironment.github.io/doc/classes/ose.lib.kind.html)
defined by this package to the `"control"` [scope](http://opensmartenvironment.github.io/doc/classes/ose.lib.scope.html).

Module [OSE PulseAudio core](http://opensmartenvironment.github.io/doc/classes/pa.lib.html) reference ... 

### OSE PulseAudio content
Provides files of OSE PulseAudio package to the browser.

Module [OSE PulseAudio content](http://opensmartenvironment.github.io/doc/classes/pa.content.html) reference ... 

## <a name="contributions"></a>Contributions
To get started contributing or coding, it is good to read about the
two main npm packages [ose](http://opensmartenvironment.github.io/doc/modules/ose.html) and [ose-bb](http://opensmartenvironment.github.io/doc/modules/bb.html).

This software is in the pre-alpha stage. At the moment, it is
premature to file bugs. Input is, however, much welcome in the form
of ideas, comments and general suggestions.  Feel free to contact
us via
[github.com/opensmartenvironment](https://github.com/opensmartenvironment).

## Licence
This software is released under the terms of the [GNU General
Public License v3.0](http://www.gnu.org/copyleft/gpl.html) or
later.
