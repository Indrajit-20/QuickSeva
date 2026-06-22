  -- ============================================
  -- QuickSeva Database Schema
  -- Run: mysql -u root -p < database.sql
  -- ============================================

  CREATE DATABASE IF NOT EXISTS quickseva_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  USE quickseva_db;

  -- ─────────────────────────────────────────────
  -- CATEGORIES
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(255),
    description TEXT,
    is_active   TINYINT(1) DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  INSERT INTO categories (name, icon, description) VALUES
    ('Plumber',       '🔧', 'Plumbing and pipe repair services'),
    ('Electrician',   '⚡', 'Electrical installation and repair'),
    ('Carpenter',     '🪚', 'Furniture and woodwork services'),
    ('Painter',       '🎨', 'Interior and exterior painting'),
    ('Cleaner',       '🧹', 'Home and office cleaning services'),
    ('AC Technician', '❄️',  'AC installation, repair and service'),
    ('Tutor',         '📚', 'Home tuition and coaching'),
    ('Beauty',        '💄', 'Salon and beauty services at home'),
    ('Cook',          '🍳', 'Personal chef and cooking services'),
    ('Driver',        '🚗', 'Personal driver and cab services');

  -- ─────────────────────────────────────────────
  -- USERS
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) UNIQUE,
    phone         VARCHAR(15) UNIQUE NOT NULL,
    password      VARCHAR(255) NOT NULL,
    role          ENUM('buyer','seller','admin') DEFAULT 'buyer',
    profile_pic   VARCHAR(255),
    address       TEXT,
    city          VARCHAR(100),
    state         VARCHAR(100),
    pincode       VARCHAR(10),
    lat           DECIMAL(10,8),
    lng           DECIMAL(11,8),
    is_verified   TINYINT(1) DEFAULT 0,
    is_active     TINYINT(1) DEFAULT 1,
    fcm_token     VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );

  -- ─────────────────────────────────────────────
  -- SELLERS (extends users where role='seller')
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS sellers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL UNIQUE,
    business_name   VARCHAR(200),
    category_id     INT,
    bio             TEXT,
    experience_yrs  INT DEFAULT 0,
    avg_rating      DECIMAL(3,2) DEFAULT 0.00,
    total_reviews   INT DEFAULT 0,
    total_orders    INT DEFAULT 0,
    is_verified     TINYINT(1) DEFAULT 0,
    is_available    TINYINT(1) DEFAULT 1,
    working_radius  INT DEFAULT 10,         -- in km
    documents       JSON,                    -- ID proof, certificates
    gst_number      VARCHAR(15) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS seller_categories (
    seller_id   INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (seller_id, category_id),
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  -- ─────────────────────────────────────────────
  -- SUB SERVICES (extends categories)
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS sub_services (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    category_id   INT NOT NULL,
    name          VARCHAR(150) NOT NULL,
    description   TEXT,
    default_price DECIMAL(10,2) DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  -- ─────────────────────────────────────────────
  -- SERVICES
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS services (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    seller_id      INT NOT NULL,
    category_id    INT,
    sub_service_id INT,
    title          VARCHAR(200) NOT NULL,
    description    TEXT,
    price          DECIMAL(10,2) NOT NULL,
    price_type     ENUM('fixed','hourly','negotiable') DEFAULT 'fixed',
    duration_hrs   DECIMAL(4,1),
    images         JSON,
    tags           JSON,
    is_active      TINYINT(1) DEFAULT 1,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (sub_service_id) REFERENCES sub_services(id) ON DELETE SET NULL
  );

  -- ─────────────────────────────────────────────
  -- ORDERS
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_number    VARCHAR(20) UNIQUE NOT NULL,
    buyer_id        INT NOT NULL,
    seller_id       INT NOT NULL,
    service_id      INT,
    status          ENUM('pending','accepted','in_progress','completed','cancelled','disputed') DEFAULT 'pending',
    total_amount    DECIMAL(10,2) NOT NULL,
    platform_fee    DECIMAL(10,2) DEFAULT 0.00,
    payment_method  ENUM('wallet','cash','online') DEFAULT 'cash',
    payment_status  ENUM('pending','paid','refunded') DEFAULT 'pending',
    address         TEXT NOT NULL,
    lat             DECIMAL(10,8),
    lng             DECIMAL(11,8),
    scheduled_at    DATETIME,
    started_at      DATETIME,
    completed_at    DATETIME,
    notes           TEXT,
    cancel_reason   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES sellers(id),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
  );

  -- ─────────────────────────────────────────────
  -- WALLET
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS wallets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL UNIQUE,
    balance    DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id      INT NOT NULL,
    type           ENUM('credit','debit') NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    balance_after  DECIMAL(10,2) NOT NULL,
    source         ENUM('order','refund','topup','withdrawal','bonus') NOT NULL,
    reference_id   VARCHAR(100),
    description    VARCHAR(255),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
  );

  -- ─────────────────────────────────────────────
  -- REVIEWS
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS reviews (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT NOT NULL UNIQUE,
    buyer_id    INT NOT NULL,
    seller_id   INT NOT NULL,
    rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    reply       TEXT,
    images      JSON,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
  );

  -- ─────────────────────────────────────────────
  -- NOTIFICATIONS
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT NOT NULL,
    type       ENUM('order','wallet','review','system','promo') DEFAULT 'system',
    ref_id     INT,
    is_read    TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- ─────────────────────────────────────────────
  -- OTP VERIFICATIONS
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS otp_verifications (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    identifier   VARCHAR(150) NOT NULL,   -- phone or email
    otp          VARCHAR(10) NOT NULL,
    type         ENUM('register','login','reset_password') DEFAULT 'register',
    expires_at   DATETIME NOT NULL,
    is_used      TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- ─────────────────────────────────────────────
  -- INDEXES for performance
  -- ─────────────────────────────────────────────
  CREATE INDEX idx_users_lat_lng       ON users(lat, lng);
  CREATE INDEX idx_sellers_category    ON sellers(category_id);
  CREATE INDEX idx_services_seller     ON services(seller_id);
  CREATE INDEX idx_orders_buyer        ON orders(buyer_id);
  CREATE INDEX idx_orders_seller       ON orders(seller_id);
  CREATE INDEX idx_orders_status       ON orders(status);
  CREATE INDEX idx_notifications_user  ON notifications(user_id, is_read);
  CREATE INDEX idx_wallet_transactions ON wallet_transactions(wallet_id);
