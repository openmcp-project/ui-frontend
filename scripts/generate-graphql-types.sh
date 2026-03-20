#!/bin/sh
set -e

if [ -z "$1" ]; then
  echo "Usage: npm run generate-graphql-types <access-token>"
  exit 1
fi

GRAPHQL_AUTH_TOKEN="Bearer $1" graphql-codegen --config graphql.config.yaml

