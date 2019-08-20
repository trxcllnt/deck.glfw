#!/usr/bin/env bash
set -o errexit;

stat node_modules/esm/node_modules/.cache &> /dev/null \
 && rm -rf node_modules/esm/node_modules/.cache

LIB_PATHS="\
$(node -e 'console.log(require("deps-opengl-raub").bin)'):\
$(node -e 'console.log(require("deps-freeimage-raub").bin)')\
"

# set LD_LIBRARY_PATH for Linux, DYLD_LIBRARY_PATH for MacOS
if [ -v LD_LIBRARY_PATH ]; then
    export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:$LIB_PATHS";
    echo "LD_LIBRARY_PATH: $LD_LIBRARY_PATH";
elif [ -v DYLD_LIBRARY_PATH ]; then
    export DYLD_LIBRARY_PATH="$DYLD_LIBRARY_PATH:$LIB_PATHS";
    echo "DYLD_LIBRARY_PATH: $DYLD_LIBRARY_PATH";
fi

FILE=${1:-"basic"};

if [[ ! -z "${FILE// }" ]]; then shift; fi;

FILE=$(node -e "console.log(require.resolve('./demo/$FILE'))")

DIR=$(dirname "$FILE")
FILE=$(basename "$FILE")

cd "$DIR" && exec node -r esm $FILE "$@"
