#!/bin/sh
# Run the Afterlife test suite (Node, zero dependencies).
cd "$(dirname "$0")/.." || exit 1
node tests/test.js
