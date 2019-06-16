# SCURI
A spec generator schematic - Spec Create Update Read (class - component, service, directive and dependencies) Incorporate (them in the result)

## Getting started

```
npm install -D scuri
ng g scuri:spec --name src/app/app.component
```
If you gen error of the `Error: Invalid rule result: Function().` see the next section about Angular <= 5.

### For Angular <= 5
Since the bundled cli (~1.7.4) is not compatible with the latest schematic version we need to install schematics separately and call scuri with that.
```
npm install -D scuri
npm i @angular-devkit/schematics-cli
schematics scuri:spec --name src/app/app.component
```

### Use case
After a component has been created it is boring and tedious to do the tests. Scuri tries to jump start that by walking the components constructor and dependencies and creating mocks for each dependency.

### Testing

To test locally, install `@angular-devkit/schematics-cli` globally and use the `schematics` command line tool. That tool acts the same as the `generate` command of the Angular CLI, but also has a debug mode.

Check the documentation with
```bash
schematics --help
```

### Unit Testing

`npm run test` will run the unit tests, using Jasmine as a runner and test framework.
