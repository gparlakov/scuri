# Contributing to SCuri

Hi and thanks for your contribution! We take issues, suggestions, bugs, and code. Don't have the time but still want to contribute? [We'd appreciate that](#like-it-?)

Here's a few notes about what we expect from contributors, how to get the examples, run the code and Linux/Mac specific note.

## Contributions expected to have unit tests

The SCuri project is generating spec files for Angular Apps, and it itself is covered by extensive test case suite. We expect any new code to be covered by unit test(s).

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

### Scuri-examples are a separate repo

Due to constant security issues, moving the examples in a separate repository. In order to test out the library examples contain older versions of packages and naturally get security issues discovered. It is out of scope for the main package to fix the security issues in Angular 5 example app. Still we'd like to NOT have an outstanding number of unfixed security issues to appeal to users. Hence the move.

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

## Like it?

You like the project and it gives you value? You are considering supporting it? I'd really appreciate that!

<style>.bmc-button img{height: 34px !important;width: 35px !important;margin-bottom: 1px !important;box-shadow: none !important;border: none !important;vertical-align: middle !important;}.bmc-button{padding: 7px 15px 7px 10px !important;line-height: 35px !important;height:51px !important;text-decoration: none !important;display:inline-flex !important;color:#ffffff !important;background-color:#5F7FFF !important;border-radius: 8px !important;border: 1px solid transparent !important;font-size: 24px !important;letter-spacing: 0.6px !important;box-shadow: 0px 1px 2px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 1px 2px 2px rgba(190, 190, 190, 0.5) !important;margin: 0 auto !important;font-family:'Cookie', cursive !important;-webkit-box-sizing: border-box !important;box-sizing: border-box !important;}.bmc-button:hover, .bmc-button:active, .bmc-button:focus {-webkit-box-shadow: 0px 1px 2px 2px rgba(190, 190, 190, 0.5) !important;text-decoration: none !important;box-shadow: 0px 1px 2px 2px rgba(190, 190, 190, 0.5) !important;opacity: 0.85 !important;color:#ffffff !important;}</style><link href="https://fonts.googleapis.com/css?family=Cookie" rel="stylesheet"><a class="bmc-button" target="_blank" href="https://www.buymeacoffee.com/bHQk8Cu">☕<span style="margin-left:5px;font-size:24px !important;">Buy me a coffee</span></a>
