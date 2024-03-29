#!/bin/sh -x
# kill the script if a command fails
set -e

# store
#EXAMPLE_FOLDER set by live-test.sh
APP_DIR=$PWD
# stops the prompt which blocks the rest of the commands
export NG_CLI_ANALYTICS=false


# install the tarballed version of scuri
npm install scuri
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

# check observable and promise create
cp -f example/service.ts ./src/app/
cp -f example/promise-and-observable.component.ts ./src/app/
npx ng g scuri:spec --name ./src/app/promise-and-observable.component.ts

# overwrite an existing test
npx ng g c test-overwrite

set +e
npx ng g scuri:spec --name ./src/app/test-overwrite/test-overwrite.component.ts
if [ "$?" -eq 0 ]
    then
        echo 'ng g should not overwrite without the --force flag'
        exit 1;
    else
        echo 'ng g without --force did not overwrite the file and returned non-zero result'
fi
set -e
# overwrite with force
npx ng g scuri:spec --name ./src/app/test-overwrite/test-overwrite.component.ts --force

# copy results for external e2e test to run
mkdir ./example/results || true
cp -f src/app/*.spec.ts src/app/**/*.spec.ts ./example/results
