#!/usr/bin/env bash
set -o errexit;

stat node_modules/esm/node_modules/.cache &> /dev/null \
 && rm -rf node_modules/esm/node_modules/.cache

LD_LIBRARY_PATH="$LD_LIBRARY_PATH\
:$(node -e 'console.log(require("deps-opengl-raub").bin)')\
:$(node -e 'console.log(require("deps-freeimage-raub").bin)')\
"

echo $LD_LIBRARY_PATH

FILE=${1:-""};

if [[ ! -z "${FILE// }" ]]; then shift; fi;

FILE=$(node -e "console.log(require.resolve('./$FILE'))")

DIR=$(dirname "$FILE")
FILE=$(basename "$FILE")

cd "$DIR" && exec node -r esm $FILE
