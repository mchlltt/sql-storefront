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
  ('Antidote', 'Status Recovery', 80.00, 30),
  ('Elixir', 'PP Recovery', 50.00, 60),
  ('Full Heal', 'Status Recovery', 30.00, 35),
  ('Hyper Potion', 'HP Recovery', 30.00, 10),
  ('Revive', 'HP Recovery', 70.00, 35),
  ('Dragon Scale', 'Evolutionary Item', 150.00, 2),
  ('Dusk Stone', 'Evolutionary Item', 200.00, 1),
  ('Razor Fang', 'Evolutionary Item', 230.00, 2),
  ('Durin Berry', 'Berry', 20.00, 20),
  ('Leppa Berry', 'Berry', 30.00, 30);

SELECT *
FROM products;
