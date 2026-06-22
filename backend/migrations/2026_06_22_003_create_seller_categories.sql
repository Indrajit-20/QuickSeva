-- Migration to create seller_categories table
CREATE TABLE IF NOT EXISTS seller_categories (
  seller_id   INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (seller_id, category_id),
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
