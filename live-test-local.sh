#!/bin/sh -o

#do not kill the script if a command fails

rm -rf dist
rm e2e/results/*.spec.ts
rm -rf example/results

set -e
npm run build

# package for local install
mv $(npm pack) ./example/scuri.next.tgz

docker pull gparlakov/scuri:angular-14-app-v2
APP_DIR="$(docker inspect --format='{{.Config.WorkingDir}}' gparlakov/scuri:angular-14-app-v2)"

export EXAMPLE_FOLDER='example'

# support DEBUG_LIVE_TEST live-test
if test -z "${DEBUG_LIVE_TEST}";  then
  FLAGS='-t --rm'
  ENTRYPOINT=$APP_DIR/$EXAMPLE_FOLDER/run-plus.sh
else
  FLAGS='-it'
  ENTRYPOINT=/bin/sh
fi

# what 
echo 'docker run $FLAGS -v $(pwd)/example:$APP_DIR/example --entrypoint $ENTRYPOINT gparlakov/scuri:angular-14-app-v2'

# /example volume to access local files and then take the results from running the command 
docker run $FLAGS -v $(pwd)/example:$APP_DIR/example --entrypoint $ENTRYPOINT gparlakov/scuri:angular-14-app-v2

# test the results 
cp ./example/results/*.* ./e2e/results
npx jest --roots=./e2e -- ./e2e/check-results.spec.ts 