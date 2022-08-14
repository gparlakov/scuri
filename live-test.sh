#!/bin/sh

#do not kill the script if a command fails
#set -e

mv $(npm pack) ./example/scuri.next.tgz
APP_DIR="$(docker inspect --format='{{.Config.WorkingDir}}' gparlakov/scuri:angular-14-app-v2)"
docker run -t -v $(pwd)/example:$APP_DIR/example --entrypoint $APP_DIR/example/run-plus.sh --rm gparlakov/scuri:angular-14-app-v2
