const { Sequelize } = require('sequelize');
const config = require("../config.json");

const sequelize = new Sequelize(config.MySql.database, config.MySql.user, config.MySql.password, {
    host: config.MySql.host,
    port: config.MySql.port,
    dialect: 'mysql'
});

sequelize.authenticate()
    .then(() => console.log("Ошибка подключения к БД!"))
    .catch(() => console.log("Ошибка подключения к БД!"));

module.exports = sequelize;