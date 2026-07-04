CREATE TABLE IF NOT EXISTS policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(150) NOT NULL,
  content LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO policies (`key`, title, content) VALUES
('privacy_policy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Welcome to QuickSeva. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p><p>By using our service, you agree to the collection and use of information in accordance with this policy.</p>')
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content);

INSERT INTO policies (`key`, title, content) VALUES
('terms_of_service', 'Terms of Service', '<h1>Terms of Service</h1><p>Welcome to QuickSeva. By accessing or using our services, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access our services.</p><p>We reserve the right to revise or update these terms at any time. Your continued use of the website after changes are posted constitutes acceptance of those changes.</p>')
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content);
