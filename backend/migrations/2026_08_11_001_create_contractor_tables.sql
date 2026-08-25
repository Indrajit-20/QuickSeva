-- Migration: Create Contractor Tables & Role Additions
-- Date: 2026-08-11

-- 1. Ensure user role supports 'contractor'
ALTER TABLE users MODIFY COLUMN role ENUM('buyer', 'seller', 'contractor', 'admin') DEFAULT 'buyer';

-- Add contractor-specific columns to users table if missing
ALTER TABLE users ADD COLUMN company_name VARCHAR(255) NULL AFTER name;
ALTER TABLE users ADD COLUMN trade_specialization VARCHAR(150) NULL AFTER company_name;
ALTER TABLE users ADD COLUMN is_verified_contractor TINYINT(1) DEFAULT 0 AFTER is_verified;

-- Add contractor verification & document fields to users table
ALTER TABLE users ADD COLUMN gstin VARCHAR(20) NULL;
ALTER TABLE users ADD COLUMN pan_number VARCHAR(20) NULL;
ALTER TABLE users ADD COLUMN license_number VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN verification_doc_url VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN verification_notes TEXT NULL;

-- 2. Contractor Site Posts (Labor Demand & Labor Supply)
CREATE TABLE IF NOT EXISTS contractor_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NULL,
  post_type ENUM('demand_workers', 'supply_workers') DEFAULT 'demand_workers',
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  contact_name VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  whatsapp_phone VARCHAR(20) NULL,
  site_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NULL,
  pincode VARCHAR(10) NULL,
  lat DECIMAL(10, 7) NULL,
  lng DECIMAL(10, 7) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amenities JSON NULL,
  description TEXT NULL,
  status ENUM('active', 'closed', 'expired') DEFAULT 'active',
  is_featured TINYINT(1) DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contractor_posts_user FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Contractor Post Requirements (Multi-labor line items per post)
CREATE TABLE IF NOT EXISTS contractor_post_requirements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  role_title VARCHAR(150) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  wage_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  wage_type ENUM('per_day', 'per_hour', 'per_month', 'fixed') DEFAULT 'per_day',
  skills_required TEXT NULL,
  CONSTRAINT fk_contractor_req_post FOREIGN KEY (post_id) REFERENCES contractor_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customer Quote Requests (Customer -> Contractor for Home/Project contracts)
CREATE TABLE IF NOT EXISTS contractor_quote_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  service_type VARCHAR(150) NOT NULL,
  notes TEXT NULL,
  status ENUM('pending', 'contacted', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contractor_quote_contractor FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Contractor Applications (Agency/Worker -> Contractor for Site Posts)
CREATE TABLE IF NOT EXISTS contractor_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  applicant_name VARCHAR(150) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  applicant_type ENUM('individual', 'group_leader', 'agency') DEFAULT 'agency',
  workers_count INT NOT NULL DEFAULT 1,
  notes TEXT NULL,
  status ENUM('pending', 'contacted', 'hired', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contractor_app_post FOREIGN KEY (post_id) REFERENCES contractor_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Contractor Work Portfolio Images
CREATE TABLE IF NOT EXISTS contractor_work_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  title VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contractor_work_user FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
