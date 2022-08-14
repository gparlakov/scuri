#!/bin/sh

#do not kill the script if a command fails
rm -rf dist
set -e
npm run build

mv $(npm pack) ./example/scuri.next.tgz

APP_DIR="$(docker inspect --format='{{.Config.WorkingDir}}' gparlakov/scuri:angular-14-app-v2)"

export EXAMPLE_FOLDER='example'

if test -z "${DEBUG_LIVE_TEST}";  then
  FLAGS='-t --rm'
  ENTRYPOINT=$APP_DIR/$EXAMPLE_FOLDER/run-plus.sh
else
  FLAGS='-it'
  ENTRYPOINT=/bin/sh
  ENTRYPOINT=$APP_DIR/$EXAMPLE_FOLDER/run-plus.sh
fi

docker run $FLAGS -v $(pwd)/example:$APP_DIR/example --entrypoint $ENTRYPOINT gparlakov/scuri:angular-14-app-v2

cp ./example/results/*.* ./e2e/results
npx jest --roots=./e2e -- ./e2e/check-results.spec.ts 