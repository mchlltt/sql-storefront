var mysql = require('mysql');
var inquirer = require('inquirer');
var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '5555',
    database: 'bamazon_db'
});

testConnection();

function testConnection() {
    connection.connect(function (err) {
        if (err) {
            console.log('Unable to connect to the database.');
        }
    });
}

