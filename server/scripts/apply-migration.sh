#!/bin/bash
echo "apply migration..."
grandParentDir=$(dirname "$(realpath $0)")/..

echo -e "\n🚀 Compiling app ..."
nest build
wait

echo -e "\n🌟 Compile done"

npx typeorm-ts-node-esm migration:run -d $grandParentDir/dist/db/datasource.js
wait

echo -e "\n Migration applied"
