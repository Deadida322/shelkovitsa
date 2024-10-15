$NAME = Read-Host "enter migration name:"
echo $NAME
nest build
npx typeorm-ts-node-esm migration:generate $pwd\src\db\migrations\$NAME -d $pwd\dist\db\datasource.js