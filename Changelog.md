0.8.5 Fix [issue #34](https://github.com/gparlakov/scuri/issues/34) - update should be able to handle nested setup function

0.8.4 Fix [issue #30](https://github.com/gparlakov/scuri/issues/30) - autospy schematic accepts `path` to tell it where to __place__ the created file

0.8.3 Fix the missing autospy files

0.8.2 Release with only doc changes - no other changes. Required to update the doc on https://www.npmjs.com/package/scuri site.

0.8.1 Release with only doc changes - no other changes. Required to update the doc on https://www.npmjs.com/package/scuri site.

0.8.0 AutoSpy create schematic. Support for jasmine and jest. As well as ts 2.8 and previous(legacy). To use:
``` schematics scuri:autospy ``` - for angular 5 and previous
``` ng g scuri:autospy ``` for angular 6 and up
Both cases requires `npm i scuri` (or `npm i -g scuri`) and the first requires `npm i -g @angular-devkit/schematics-cli`.

0.7.0 (and 0.6.2) Import dependencies when including them in the spec-s. Both for Create and Update

0.6.1 Actually have all required deps and build the js...

0.6.0 Make all unneeded dependencies devDependencies to avoid clashing and breaking users. All we need is the devkit core and the rest is dev-time dependency only

0.5.0 Support for updating the spec to test out the new methods part of the class. Case - add one more method to the class - run scuri update (via [scuri-code](https://marketplace.visualstudio.com/items?itemName=gparlakov.scuri-code) or the command line)

0.4.0 Change behavior to rely on flags to decide if we should update. If --update is passed in we always try to update. If not we always try to create new spec file. From there on the schematics cli will make the decision based on --force if we'll overwrite or not.

0.3.1 Fix bug where the generated file was not getting moved next to the class-under-test file.
We can't support ng5 because using the `move` rule is not compatible with the legacy wat of returning the result vs returning
a function (Rule) that the cli (ng cli or schematics) should deal with
0.3.0 Support updating SCuri generated spec files (ones with a function setup() and a builder in it)

0.2.3 Have the generated `it` method call the class-under-test public method
0.2.2 Update docs for easy start and contributor guide.
0.2.1 Support `async` type of public method. Exclude `private` and `protected`.
0.2.0 Rule executes and returns so Angular 5 will work with it

0.1.2 Make the first argument be the `--name`.

0.1.1 Add files. Can't generate spec w/o them.

0.1.0 Initial release:
Reads angular component and creates a spec for it with a setup builder method and an it spec for each public method.
Uses the autoSpy by default. Uses the AAA arrange act assert convention.
