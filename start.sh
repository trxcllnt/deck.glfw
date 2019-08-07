#!/usr/bin/env bash
set -o errexit;

LD_LIBRARY_PATH="$LD_LIBRARY_PATH\
:$(node -e 'require("deps-opengl-raub").bin()')\
:$(node -e 'require("deps-freeimage-raub").bin()')\
" exec "$@"
