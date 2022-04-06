const mysql = require("mysql");
const config = require("../config.json");

const connection = mysql.createConnection(config.MySql);

connection.connect((error) => {
    if (error) {
        return console.log("Ошибка подключения к БД!");
    } else {
        return console.log("Подключение произошло успешно!");
    }
})

module.exports = connection;