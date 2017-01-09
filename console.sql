CREATE DATABASE bamazon_db;

USE bamazon_db;

CREATE TABLE products (
  item_id         INT(11) AUTO_INCREMENT NOT NULL,
  product_name    VARCHAR(250)           NOT NULL,
  department_name VARCHAR(250)           NULL,
  price           DECIMAL(8, 2)          NOT NULL,
  stock_quantity  INT(11)                NOT NULL,
  PRIMARY KEY (item_id)
);

INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES
  ('Gummy Worms', 'Candy', 2.00, 300),
  ('Goldfish', 'Crackers', 3.00, 600);

SELECT *
FROM products;
