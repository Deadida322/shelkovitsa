echo 'apply migrations'
nest build
npx typeorm-ts-node-esm migration:run -d $pwd\dist\db\datasource.js