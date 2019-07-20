0.5.0 Support for updating the spec to test out the new methods part of the class. Case - add one more method to the class - run scuri update (via [scuri-code](https://marketplace.visualstudio.com/items?itemName=gparlakov.scuri-code) or the command line)
0.4.0 Change behavior to rely on flags to decide if we should update. If --update is passed in we always try to update. If not we always try to create new spec file. From there on the schematics cli will make the decision based on --force if we'll overwrite or not.
0.3.1 Fix bug where the generated file was not getting moved next to the class-under-test file.
We can't support ng5 because using the `move` rule is not compatible with the legacy wat of returning the result vs returning
a function (Rule) that the cli (ng cli or schematics) should deal with

0.3.0 Support updating SCURI generated spec files (ones with a function setup() and a builder in it)

0.2.3 Have the generated `it` method call the class-under-test public method
0.2.2 Update docs for easy start and contributor guide.
0.2.1 Support `async` type of public method. Exclude `private` and `protected`.
0.2.0 Rule executes and returns so Angular 5 will work with it

0.1.2 Make the first argument be the `--name`.

0.1.1 Add files. Can't generate spec w/o them.

0.1.0 Initial release:
Reads angular component and creates a spec for it with a setup builder method and an it spec for each public method.
Uses the autoSpy by default. Uses the AAA arrange act assert convention.
