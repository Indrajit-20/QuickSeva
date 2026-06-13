-- Paid lead generation tracking
-- Stores a single lead charge per buyer->seller->service interaction.

CREATE TABLE IF NOT EXISTS lead_charges (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  buyer_id BIGINT NOT NULL,
  seller_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  lead_source VARCHAR(32) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lead_charge (buyer_id, seller_id, service_id)
);

