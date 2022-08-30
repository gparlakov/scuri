# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 1.3.0 - 2022-08-30

### Added

- add default values for promise and observable returning method spies [#148](https://github.com/gparlakov/scuri/issues/148)
- add support for strict TS for autospy
- add e2e testing using verdaccio (local npm registry), verifying new version of npm actually installs and runs the create and update on changes

## [1.2.0] - 2021-11-23

### Added

-   use custom template when updating spec for a class. Use // scuri:mark and /**scuri:template:mark:<%my template%>/* to mark the location and the template for the update. Multiple marks and templates supported. See [custom template guide](https://github.com/gparlakov/scuri/blob/master/docs/custom-template-guide.md)

## [1.1.0] - 2021-10-19

### Added

-   Add option for user to specify their own template for a file with function (1.1.0-rc.1) (--functionTemplate or functionTemplate in config)
-   Add configuration by file(1.0.8-rc.2) (configure classTemplate)
-   Add option for user to specify their own template(1.0.8-rc.1) (--classTemplate)

### Changed

-   Updated npm package versions(1.0.8-rc.2)
-   Allow `--name` to be skipped - infers first arg as file name

## [1.0.7] - 2021-02-24

### Changed

-   Update the Readme

## [1.0.6] - 2021-01-09

### Fixed

-   Issue 108 - use the class shorthand when updating a spec

## [1.0.5] - 2020-08-31

### Added

-   Issue 94 - add a single test case when creating the spec for a class without public methods
-   Issue 95 - add a test case for a file with at least one exported function
-   Make the shorthand dynamic based on the type of tested entity - 'c' for component, 's' for service, etc.

## [1.0.4] - 2020-08-30

### Fixed

-   Issue 100 - only add missing test cases based on method invocations, rather than test case title
-   Typos and syntax errors in readme and test cases

### Added

-   Moved the contributing guide out to its own file

## [1.0.3] - 2020-08-19

### Fixed

-   Issue 93 - line endings in the template switched to LF to support all platforms
-   Issue 92 - export SpyOf by default

## [1.0.2] - 2020-04-03

### Added

-   Wiki link from README.md

### Fixed

-   README.md links

## [1.0.1] - 2020-04-03

### Fixed

-   Actually publish the @latest instead of @next

## [1.0.0] - 2020-03-21

### Fixed

-   Correct indentation of added dependencies (following the last symbol just above) [Issue 3](https://github.com/gparlakov/scuri/issues/3)
-   Correct indentation of added methods (following the last symbol just above) [Issue 3](https://github.com/gparlakov/scuri/issues/3)
-   Correct imports: only import missing modules and do not double existing imports [Issue 3](https://github.com/gparlakov/scuri/issues/73)

## [0.9.4] - 2020-03-11

### Added

-   Fix auto-spy not working with Typescript target e2015. The issue comes from methods of classes NOT being enumerable i.e. Object.keys(obj) will not "see" them

## [0.9.3] - 2019-09-23

### Fixed

-   Allow the update to take the name of the spec (`--update c.spec.ts` will now work instead of throwing)

## [0.9.2] - 2019-09-23

### Changed

-   Update the Readme [roadmap](./readme.md#road-map)

## [0.9.1] - 2019-09-22

### Added

-   Finish [issue #40](https://github.com/gparlakov/scuri/issues/40) - update on spec created by the ng CLI - add missing providers by using the setup function

## [0.9.0] - 2019-09-22

### Added

-   Start on [issue #40](https://github.com/gparlakov/scuri/issues/40) - update on spec with missing `setup` function should create it. Plus fixed a small issue where `update` would add a comma when no new constructor params are added.

## [0.8.5] - 2019-09-21

### Fix

-   [issue #34](https://github.com/gparlakov/scuri/issues/34) - update should be able to handle nested setup function

## [0.8.4] - 2019-09-17

### Fix

-   [issue #30](https://github.com/gparlakov/scuri/issues/30) - autospy schematic accepts `path` to tell it where to **place** the created file

## [0.8.3] - 2019-09-08

### Fixed

-   Fix the missing autospy files

## [0.8.2] - 2019-08-31

### Changed

-   Release with only doc changes - no other changes. Required to update the doc on https://www.npmjs.com/package/scuri site.

## [0.8.1] - 2019-08-31

### Changed

-   Release with only doc changes - no other changes. Required to update the doc on https://www.npmjs.com/package/scuri site.

## [0.8.0] - 2019-08-20

### Added

-   AutoSpy create schematic. Support for jasmine and jest. As well as ts 2.8 and previous(legacy). To use:
    `schematics scuri:autospy` - for angular 5 and previous
    `ng g scuri:autospy` for angular 6 and up
    Both cases requires `npm i scuri` (or `npm i -g scuri`) and the first requires `npm i -g @angular-devkit/schematics-cli`.

## [0.7.0] - 2019-08-11

### Added

-   Import dependencies when including them in the spec-s. Both for Create and Update

## [0.6.2] - 2019-08-08

### Added

-   Import dependencies when including them in the spec-s. Both for Create and Update

## [0.6.1] - 2019-07-31

### Fixed

-   Actually have all required deps and build the js...

## [0.6.0] - 2019-07-31

### Changed

-   Make all unneeded dependencies devDependencies to avoid clashing and breaking users. All we need is the devkit core and the rest is dev-time dependency only

## [0.5.0] - 2019-07-20

### Added

-   Support for updating the spec to add tests for newly added methods in a class. Case - add one more method to the class - run scuri update (via [scuri-code](https://marketplace.visualstudio.com/items?itemName=gparlakov.scuri-code) or the command line)

## [0.4.0] - 2019-07-16

### Changed

-   Change behavior to rely on flags to decide if we should update. If `--update` is passed in we always try to update. If not we always try to create a new spec file. From there on the schematics cli will make the decision (based on `--force`) to overwrite or not.

## [0.3.1] - 2019-07-06

### Fixed

-   Fix bug where the generated file was not getting moved next to the class-under-test file.
    We can't support ng5 because using the `move` rule is not compatible with the legacy wat of returning the result vs returning
    a function (Rule) that the cli (ng cli or schematics) should deal with

## [0.3.0] - 2019-06-29

### Added

-   Support updating SCuri generated spec files (ones with a function setup() and a builder in it)

## [0.2.3] - 2019-06-29

### Added

-   Have the generated `it` method call the class-under-test public method

## [0.2.2] - 2019-06-29

### Added

-   Update docs for easy start and contributor guide.

## [0.2.1] - 2019-06-29

### Added

-   Support `async` type of public method. Exclude `private` and `protected`.

## [0.2.0] - 2019-06-27

### Added

-   Rule executes and returns so Angular 5 will work with it

## [0.1.2] - 2019-06-16

### Added

-   Make the first argument be the `--name` by default

## [0.1.1] - 2019-06-14supporting

### Added

-   Add files. Can't generate spec w/o them.

## [0.1.0] -

### Added

-   Initial release
-   Reads angular component and creates a spec for it with a setup builder method and an it spec for each public method.
    Uses the autoSpy by default. Uses the AAA arrange act assert convention.
