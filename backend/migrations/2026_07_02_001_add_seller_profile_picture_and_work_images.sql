-- Migration: Add profile_picture_url and create seller_work_images table

-- 1. Add profile_picture_url to sellers
ALTER TABLE sellers ADD COLUMN profile_picture_url VARCHAR(255) DEFAULT NULL;

-- 2. Create seller_work_images table for portfolio
CREATE TABLE IF NOT EXISTS seller_work_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);
