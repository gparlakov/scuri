# SCURI
A spec generator schematic - Spec Create Update Read (class - component, service, directive and dependencies) Incorporate (them in the result)

## Use case
After a component has been created it is boring and tedious to do the tests. Scuri tries to jump start that by walking the components constructor and dependencies and creating mocks for each dependency.

## Getting started
```
npm install -D scuri
ng g scuri:spec --name src/app/app.component
```
If you gen error of the `Error: Invalid rule result: Function().` see the [troubleshooting section below](#Rule_result_Function).

## Contributing

### Testing
To test locally, install `@angular-devkit/schematics-cli` globally and use the `schematics` command line tool. That tool acts the same as the `generate` command of the Angular CLI, but also has a debug mode.

Check the documentation with
```bash
schematics --help
```

### Unit Testing
`npm run test` will run the unit tests, using Jasmine as a runner and test framework.


## Troubleshooting

###  Rule result Function
To workaround the `Error: Invalid rule result: Function().` install schematics separately and call `scuri` with that.
```
npm install -D scuri
npm i @angular-devkit/schematics-cli
schematics scuri:spec --name src/app/app.component.ts
```
