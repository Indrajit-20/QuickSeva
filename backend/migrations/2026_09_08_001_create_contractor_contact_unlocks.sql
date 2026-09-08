CREATE TABLE IF NOT EXISTS contractor_contact_unlocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  application_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_contractor_application (contractor_id, application_id),
  CONSTRAINT fk_unlock_contractor FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_unlock_application FOREIGN KEY (application_id) REFERENCES contractor_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
