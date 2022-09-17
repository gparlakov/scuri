#!/bin/sh -x

rm -rf dist
rm e2e/results/*.spec.ts
rm -rf example/results
# in case it's running still
docker-compose -f ./.verdaccio/docker-compose.yml down

#kill the script if a command fails
set -e
npm run build

# start the local registry

sudo chown -R 10001:65533 $PWD/.verdaccio
docker-compose -f ./.verdaccio/docker-compose.yml up -d
# publish to local registry
npm_config_registry=http://localhost:4873/ npm publish


docker pull gparlakov/scuri:angular-14-app-v2
APP_DIR="$(docker inspect --format='{{.Config.WorkingDir}}' gparlakov/scuri:angular-14-app-v2)"

export EXAMPLE_FOLDER='example'

if test -z "${DEBUG_LIVE_TEST}";  then
  FLAGS='-t --rm'
  ENTRYPOINT=$APP_DIR/$EXAMPLE_FOLDER/run-plus.sh
else
  FLAGS='-it'
  ENTRYPOINT=/bin/sh
fi

docker run $FLAGS -v $(pwd)/example:$APP_DIR/example --entrypoint $ENTRYPOINT --net=host -e npm_config_registry=http://localhost:4873/ gparlakov/scuri:angular-14-app-v2

cp ./example/results/*.* ./e2e/results
npx jest --roots=./e2e -- ./e2e/check-results.spec.ts

# stop local registry
docker-compose -f ./.verdaccio/docker-compose.yml down
