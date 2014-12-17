# Open Smart Environment PulseAudio package

This package implements volume control for the [OSE Media player].

## Status
- Pre-alpha stage (insecure and buggy)
- Unstable API
- Gaps in the documentation
- No test suite

This is not yet a piece of download-and-use software. Its important
to understand the basic principles covered by this documentation.

Use of this software is currently recommended only for users that
wish participate in the development process (see Contributions).

TODO: Make contribution a link

## Getting started
To get started with OSE, refer to the [ose-bundle] package and
[Media player example application].

## Modules
Open Smart Environment PulseAudio package consists of the following modules:
- PulseAudio control kind
- OSE PulseAudio core
- OSE PulseAudio content

### PulseAudio control kind
[Entry kind] for PulseAudio instances

Each entry communicates with PulseAudio via its D-Bus
interface. This functionality is currently implemented in a Python
child process.

Module [PulseAudio control kind] reference ... 

### OSE PulseAudio core
Core singleton of ose-pa npm package. Registers [entry kinds]
defined by this package to the `"control"` [scope].

Module [OSE PulseAudio core] reference ... 

### OSE PulseAudio content
Provides files of OSE PulseAudio package to the browser.

Module [OSE PulseAudio content] reference ... 

## Contributions
To get started contributing or coding, it is good to read about the
two main npm packages [ose] and [ose-bb].

This software is in the pre-alpha stage. At the moment, it is
premature to file bugs. Input is, however, much welcome in the form
of ideas, comments and general suggestions.  Feel free to contact
us via
[github.com/opensmartenvironment](https://github.com/opensmartenvironment).

## License
This software is licensed under the terms of the [GNU GPL version
3](../LICENCE) or later
