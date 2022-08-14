#!/bin/sh
# kill the script if a command fails
set -e

# store
APP_DIR=$PWD
# stops the prompt which blocks the rest of the commands
export NG_CLI_ANALYTICS=false

# install the tarballed version of scuri
npm i ./example/scuri.next.tgz 
# use headless chrome in karma config 
node ./switch-to-chrome-headless.js ./karma.conf.js
node ./switch-to-chrome-headless.js ./src/karma.conf.js
# add autospy to paths and create the file
node ./add-auto-spy-to-path.js ./tsconfig.json
npx ng g scuri:autospy

npx ng g scuri:spec --name src/app/my-com/my-com.component.ts 
# npx ng g scuri:spec --name src/app/service.ts
# npx ng g scuri:spec --name src/app/other/other.component.ts

