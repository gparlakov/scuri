# Contributing to SCuri

Hi and thanks for your contribution! We take issues, suggestions, bugs, and code. Don't have the time but still want to contribute? [We'd appreciate that](#like-it-?)

A few notes about what we expect from contributors, how to get the examples, run the code and a Linux/Mac specific note.

## Contribution workflow

-   select an issue you'd like to work on (please create one if missing)
-   clone the repo
-   open a feature branch from master for your work
    -   prettier is run on every commit for the changed files
    -   Why? For consistency.
-   write some tests
-   try to make small changes
    -   no one wants to review a 40 files commit
    -   large number of files changed makes it easy to miss issues
-   open a PR to master
-   discuss the PR

## Contributions expected to have unit tests

The SCuri project is generating spec files for Angular Apps, and is itself covered by an extensive test case suite. We expect any new code to be covered by unit test(s).

### Where do unit tests live?

They live in the `/tests` folder and they adhere to the naming convention below.

### Unit test naming convention

We started by having the create and update test cases in the `spec-create.spec.ts` and `spec-update.spec.ts`. As the use cases and their setup grow in numbers and complexity we've moved to a spec file per use case.

Try and create test files per use case:
`spec-without-setup-function` - will house all tests for that use case.

Begin specs with:

-   `spec-create.` - scuri:spec (ex. `spec.spec.ts` - deprecated - not named by per-use-case-name-convention above)
-   `spec-update.` - scuri:spec --update (ex `spec-update.testbed-tests.spec.ts`)
-   `all.` - both of the above - when use case covers both create and update spec

### Scuri-examples are in a separate repo

Due to constant security issues, moving the examples in a separate repository. To test out the library examples contain older versions of packages and naturally get security issues discovered. It is out of scope for the main package to fix the security issues in the Angular 5 example app. We'd like to NOT have an outstanding number of unfixed security issues to appeal to users. Hence the move.

Please keep in mind the separate repository and clone it to do the testing - `git clone https://github.com/gparlkov/scuri-examples`. The examples assume that the two repos are cloned in adjacent folders

```
|--scuri
|--scuri-examples
```

Use `scuri-examples.code-workspace` for VS Code to edit both the main project and the examples.

### Clone and run

In this example I clone `https://github.com/gparlakov/scuri`. If you want to contribute fork and clone your own forked repo.

```
git clone https://github.com/gparlakov/scuri
git clone https://github.com/gparlkov/scuri-examples
cd scuri
npm install
npm install -g @angular-devkit/schematics-cli
npm run build
schematics .:spec --name ../scuri-examples/example.component.ts
```

Or use the package.json/scripts setup for the day-to-day development to speed things up instead of the **last three lines** from above example: `npm run build.run -- --force --dry-run false`

-   `--force` is required because there is already an example.component.spec.ts file
-   `--dry-run false` is required because by default when running local schematics they are run in --debug mode (which implies _--dry-run_). That only shows the expected actions and outcomes but does not actually modify the files on the filesystem.

### Use in an Angular app

In this example I'm using the `example/angular-5-app` bundled with this repo. Feel free to use any Angular application you work on

```
cd scuri
npm link
cd ..\scuri-examples\angular-5-app
npm link scuri
ng g scuri:spec --name src/app/app.component.ts --force
```

-   `cd #into-my-scuri-cloned-src-folder` or wherever you cloned the source - for example `cd scuri`
-   `npm link` links to the current folder
-   `cd example\angular-5-app` or any real angular application
-   `npm link scuri` # links scuri to the current folder/packages - as if - you've installed it like npm i -D scuri
-   `ng g scuri:spec --name src/app/app.component.ts --force` # force to overwrite the current spec

### Unit Testing

Single run:

```
npm run test
```

Runs the **unit tests**, using Jasmine as a runner and test framework. It builds the spec schematic, then builds the test in `/tests` and runs them.

Or watch and run:

```
npm run watch.test
```

Will do the same as above but will also **watch** for file changes and **re-run** the tests.

### Linux/Mac

Keep in mind examples are using windows style folder structure `\my\folder\structure\` which would need to be changed to `/my/folder/structure/` on Linux/Mac

## Release flow

-   example targets release of 1.0.6 - patch version - no braking changes, no new API - just fixes/documentation/etc
-   create a feature branch
-   work commit, open a PR to master
-   for version `@next` open a branch from master named `release/1.0.6-rc.1` (change vers)
-   approval required at this point [for @next version](https://dev.azure.com/gparlakov/Scuri/_releaseProgress?_a=release-pipeline-progress&releaseId=68)
-   `scuri@next` is now `1.0.6-rc.1`. Test if the @next version works as expected
-   in case of issues - fix in feature branch, merge to master and open `release/1.0.6-rc.2`
-   when done - open a branch from master named `release/1.0.6`
-   approval required at this point [for @latest version](https://dev.azure.com/gparlakov/Scuri/_releaseProgress?_a=release-pipeline-progress&releaseId=74)
-   scuri@latest is now `scuri@1.0.6`

## Like it?

You like the project and it gives you value? You are considering supporting it? I'd really appreciate that!
<a class="bmc-button" target="_blank" href="https://www.buymeacoffee.com/bHQk8Cu">☕<span style="margin-left:5px;font-size:24px !important;">Buy me a coffee</span></a>
