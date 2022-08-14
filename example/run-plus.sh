#!/bin/sh
# kill the script if a command fails
set -e

# store
#EXAMPLE_FOLDER set by live-test.sh
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

# create spec classic (no templates)
npx ng g scuri:spec --name src/app/other/other.component.ts

# update spec classic (no templates)

# create a test with a template
npx ng g scuri:spec --name src/app/my-com/my-com.component.ts --class-template './example/__specFileName__.template'

# update a test with a template and template-functions
cp -f example/to-update.componen*.ts ./src/app/
npx ng g scuri:spec --name ./src/app/to-update.component.ts --class-template './example/__normalizedName__.custom.spec.ts.template' --update

#npm test

cp -f src/app/*.spec.ts src/app/**/*.spec.ts ./example/results