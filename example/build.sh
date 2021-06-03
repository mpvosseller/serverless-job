#!/usr/bin/env bash
yarn clean
yarn tsc
mkdir build/dist
cp -r build/lib/lambda-handler/ build/dist
yarn install --frozen-lockfile --production --modules-folder build/dist/node_modules
rm -rf build/dist/node_modules/serverless-job/.git build/dist/node_modules/serverless-job/node_modules build/dist/node_modules/serverless-job/example
cd build/dist
zip -r ../dist.zip .

