#!/usr/bin/env bash
set -o errexit;

stat node_modules/esm/node_modules/.cache &> /dev/null \
 && rm -rf node_modules/esm/node_modules/.cache

LIB_PATHS="\
$(node -e 'console.log(require("deps-opengl-raub").bin)'):\
$(node -e 'console.log(require("deps-freeimage-raub").bin)')\
"

# set LD_LIBRARY_PATH for Linux
if [[ "$OSTYPE" == "linux-gnu" ]]; then
    export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:$LIB_PATHS";
# Don't need to do anything in OSX
# elif [[ "$OSTYPE" == "darwin"* ]]; then
# Don't know if this is necessary in Windows?
# elif [[ "$OSTYPE" == "cygwin" ]]; then
#     export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:$LIB_PATHS";
# elif [[ "$OSTYPE" == "msys" ]]; then
#     export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:$LIB_PATHS";
# elif [[ "$OSTYPE" == "win32" ]]; then
#     export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:$LIB_PATHS";
fi

FILE=${1:-"basic"};

if [[ ! -z "${FILE// }" ]]; then shift; fi;

FILE=$(node -e "console.log(require.resolve('./demo/$FILE'))")

DIR=$(dirname "$FILE")
FILE=$(basename "$FILE")

cd "$DIR" && exec node -r esm $FILE "$@"
