#!/bin/bash

tsc -p tsconfig.json

cp ./collection.json ./dist

cp --parents ./src/spec/schema.json ./dist

cp --parents ./src/autospy/schema.json ./dist

cp --parents ./src/update-custom/schema.json ./dist

cp --parents -r ./src/autospy/files ./dist

cp -r --parents ./src/spec/files ./dist
