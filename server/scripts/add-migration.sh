#!/bin/bash
echo "Enter migration name:"
read NAME
grandParentDir=$(dirname "$(realpath $0)")/..

echo -e "\n🚀 Compiling app ..."
nest build
wait

echo -e "\n🌟 Compile done"

npx typeorm-ts-node-esm migration:generate $grandParentDir/src/db/migrations/$NAME -d $grandParentDir/dist/db/datasource.js
wait

echo -e "\n Migration added"
