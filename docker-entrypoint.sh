dockerize -wait tcp://selody-db:3308 -timeout 20s

echo "Start server"

node ./src/app.js