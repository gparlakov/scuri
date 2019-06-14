# SCURI
A spec generator schematic - Spec Create Update Read (class - component, service, directive and dependencies) Incorporate (them in the result)

## Getting started

```
npm install -D scuri
ng g scuri:spec --name src/app/app.component

```
### For Angular <= 5
```
npm install -D scuri
npm i @angular-devkit/schematics-cli
schematics scuri:spec --name src/app/app.component
```

### Testing

To test locally, install `@angular-devkit/schematics-cli` globally and use the `schematics` command line tool. That tool acts the same as the `generate` command of the Angular CLI, but also has a debug mode.

Check the documentation with
```bash
schematics --help
```

### Unit Testing

`npm run test` will run the unit tests, using Jasmine as a runner and test framework.
