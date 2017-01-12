// Require Node.js packages.
var mysql = require('mysql');
var inquirer = require('inquirer');

// Create MySQL connection.
var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '5555',
    database: 'bamazon_db'
});

// Initialize database snapshot and current item variables in global scope.
var snapshot;
var currentItem = {};

// Begin script by testing connection.
testConnection();

// If connection is successful, take a database snapshot.
function testConnection() {
    connection.connect(function (err) {
        if (err) {
            console.log('Unable to connect to the Bamazon. Please contact your network administrator.');
        } else {
            getDatabaseSnapshot();
        }
    });
}

// Get database snapshot to be used for user prompt.
function getDatabaseSnapshot() {
    connection.query('SELECT * FROM products', function(err, data) {
        if (err) {
            console.log(err);
        } else {
            snapshot = data;
            promptUserForSelection();
        }
    });
}

// Ask user which item and what quantity they want to buy.
function promptUserForSelection() {
    inquirer.prompt(
        [
            {
                name: 'item',
                type: 'list',
                message: 'Which item would you like to purchase?',
                choices: function () {
                    var choices = [];
                    snapshot.forEach(function (item) {
                        var name = item.item_id + ' | ' + item.product_name + ' | Price: $' + item.price + ' | Quantity Available: ' + item.stock_quantity;
                        choices.push(name);
                    });
                    return choices;
                }
            },
            {
                name: 'quantity',
                type: 'input',
                message: function(answers) {
                    return 'What quantity would you like to purchase of ' + answers.item.split(' | ')[1] + '? ' + answers.item.split(' | ')[3];
                },
                validate: function(answer) {
                    var pattern = /\d+/;
                    if (pattern.test(answer)) {
                        return true;
                    } else {
                        return 'Please enter a valid number.';
                    }
                }
            }
        ]
    ).then(
        function(answers) {

            currentItem.item_id = parseInt(answers.item.split(' | ')[0], 10);
            currentItem.product_name = answers.item.split(' | ')[1];
            currentItem.price = parseFloat(answers.item.split(' | ')[2].split('$')[1]);
            currentItem.quantity_requested = parseInt(answers.quantity, 10);


            checkDatabaseQuantity();
        }
    );
}

// Check that the requested quantity is still available in the database.
function checkDatabaseQuantity() {
    connection.query('SELECT stock_quantity FROM products WHERE item_id = ?', currentItem.item_id, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            if (currentItem.quantity_requested <= data[0].stock_quantity) {
                updateDatabase(data[0].stock_quantity);
            } else {
                sendQuantityAlert(data[0].stock_quantity);
            }
        }
    });
}

// If there is enough stock, decrement the stock in the database and give the user their total.
function updateDatabase(quantity) {
    connection.query('UPDATE products SET stock_quantity = ? WHERE item_id = ?',
        [quantity - currentItem.quantity_requested, currentItem.item_id], function(err, data) {
        if (err) {
            console.log(err);
        } else {
            returnTotalToUser();
        }
    });
}

// If there is not enough stock, alert user with current quantity and restart purchase process.
function sendQuantityAlert(quantity) {
    console.log('Sorry, insufficient quantity. Remaining quantity: %s', quantity);
    setTimeout(getDatabaseSnapshot, 1500);
}

// Display the user's total and ask whether they'd like to make more purchases.
function returnTotalToUser() {
    var total = currentItem.price * currentItem.quantity_requested;
    console.log('Purchase successful! Your total: %s', total);
    setTimeout(promptForAdditionalPurchases, 1500);
}

// If the user wants to continue shopping, restart purchase process. Otherwise, display a send-off message.
function promptForAdditionalPurchases() {
    inquirer.prompt({
        name: 'continue',
        type: 'confirm',
        message: 'Would you like to make another purchase?'
    }).then(
        function(answers) {
            if (answers.continue) {
                currentItem = {};
                getDatabaseSnapshot();
            } else {
                console.log('Thank you, have a great day!');
                connection.end();
            }
        }
    );
}
