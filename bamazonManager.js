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
var currentItem;

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
    currentItem = {};
    connection.query('SELECT * FROM products', function(err, data) {
        if (err) {
            console.log(err);
        } else {
            snapshot = data;
            promptUserForRunType();
        }
    });
}

// Ask the user what action they want to take.
function promptUserForRunType() {
    inquirer.prompt({
        name: 'type',
        type: 'list',
        choices: [
            'View Products for Sale',
            'View Low Inventory',
            'Add to Inventory',
            'Add New Product'
        ],
        default: 0,
        message: 'What would you like to do?'
    }).then(function(answers) {
        switch(answers.type) {
            case 'View Products for Sale':
                displayItems();
                break;
            case 'View Low Inventory':
                displayLowInventory();
                break;
            case 'Add to Inventory':
                selectItemToRestock();
                break;
            case 'Add New Product':
                promptForNewProductInfo();
                break;
        }
    });
}

// Show all the items for sale.
function displayItems() {

    console.log('All Items:');

    snapshot.forEach(function (item) {
        console.log(item.item_id + ' | ' + item.product_name + ' | Price: $' + item.price + ' | Quantity Available: ' + item.stock_quantity);
    });

    setTimeout(promptForAdditionalActions, 1500);
}

// Show all the items with 5 or fewer stock less.
function displayLowInventory() {

    console.log('Low Inventory Items:');

    snapshot.forEach(function (item) {
        if (item.stock_quantity <= 5) {
            console.log(item.item_id + ' | ' + item.product_name + ' | Price: $' + item.price + ' | Quantity Available: ' + item.stock_quantity);
        }
    });

    setTimeout(promptForAdditionalActions, 1500);
}

// Ask the user which item they want to restock and what quantity they would like to add.
function selectItemToRestock() {
    inquirer.prompt(
        [
            {
                name: 'item',
                type: 'list',
                message: 'Which item would you like to restock?',
                choices: function () {
                    var choices = [];
                    snapshot.forEach(function (item) {
                        var name = item.item_id + ' | ' + item.product_name + ' | Price: $' + item.price + ' | Current Quantity: ' + item.stock_quantity;
                        choices.push(name);
                    });
                    return choices;
                }
            },
            {
                name: 'quantity',
                type: 'input',
                message: function(answers) {
                    return 'What quantity would you like to add of ' + answers.item.split(' | ')[1] + '? ' + answers.item.split(' | ')[3];
                },
                validate: function(answer) {
                    var pattern = /^\d+$/;
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
            currentItem.currentQuantity = parseInt(answers.item.split('Quantity: ')[1], 10);
            currentItem.quantityToAdd = parseInt(answers.quantity, 10);

            updateDatabaseQuantity();
        }
    );
}

// Update stock_quantity in the database.
function updateDatabaseQuantity() {
    connection.query('UPDATE products SET stock_quantity = ? WHERE item_id = ?',
        [currentItem.currentQuantity + currentItem.quantityToAdd, currentItem.item_id], function(err, data) {
            if (err) {
                console.log(err);
            } else {
                confirmSuccessfulUpdate();
            }
        });
}

// Display a message to confirm that the item's stock was updated.
function confirmSuccessfulUpdate() {
    console.log('Update successful! New stock for Item #' + currentItem.item_id + ': ' + (currentItem.currentQuantity + currentItem.quantityToAdd));
    setTimeout(promptForAdditionalActions, 1500);
}

// Ask user for information about the new item to add.
function promptForNewProductInfo() {
    inquirer.prompt(
        [
            {
                name: 'itemName',
                type: 'input',
                message: 'What is the name of the new item?',
                validate: function(answer) {
                    if (answer) {
                        return true;
                    } else {
                        return 'This question is required.';
                    }
                }
            },
            {
                name: 'department',
                type: 'list',
                message: 'What department should this item be placed in?',
                choices: function() {
                    var choices = [];

                    snapshot.forEach(function (item) {
                        var department = item.department_name;
                        if (choices.indexOf(department) === -1) {
                            choices.push(department);
                        }
                    });

                    choices.push(new inquirer.Separator());
                    choices.push('Create new department');

                    return choices;
                }
            },
            {
                name: 'newDepartment',
                type: 'input',
                message: 'What should the new department be called?',
                when: function(answers) {
                    return answers.department === 'Create new department';
                },
                validate: function(answer) {
                    if (answer.length === 0) {
                        return 'Please enter a department name.';
                    } else {
                        return true;
                    }
                }
            },
            {
                name: 'price',
                type: 'input',
                message: 'What should the price be for this new item?',
                validate: function(answer) {
                    var pattern1 = /^\b\d+\.\d\d\b$/;
                    var pattern2 = /^\b\d+\b$/;
                    if (pattern1.test(answer) || pattern2.test(answer)) {
                        return true;
                    } else {
                        return 'Please enter a valid price.';
                    }
                }
            },
            {
                name: 'quantity',
                type: 'input',
                message: 'What should the initial quantity be for this item?',
                validate: function(answer) {
                    var pattern = /^\d+$/;
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

            currentItem.product_name = answers.itemName;

            if (answers.newDepartment) {
                currentItem.department_name = answers.newDepartment;
            } else {
                currentItem.department_name = answers.department;
            }

            currentItem.price = parseFloat(answers.price);
            currentItem.stock_quantity = parseInt(answers.quantity, 10);

            addProductToDatabase();
        }
    );
}

// Add item to database.
function addProductToDatabase() {
    connection.query('INSERT INTO products SET ?', [currentItem], function(err, data) {
        if (err) {
            console.log(err);
        } else {
            confirmSuccessfulAddition();
        }
    });
}

// Display a message to confirm that the new item was added.
function confirmSuccessfulAddition() {
    console.log('Successfully added new item: %s', currentItem.product_name);
    setTimeout(promptForAdditionalActions, 1500);
}

// If the user wants to continue managing the database, restart process. Otherwise, display a send-off message.
function promptForAdditionalActions() {
    inquirer.prompt({
        name: 'continue',
        type: 'confirm',
        message: 'Would you like to take another action?'
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
