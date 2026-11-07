-- JharResult multi-category posts migration
-- Run this once in phpMyAdmin after selecting the jharresult database.

CREATE TABLE IF NOT EXISTS post_categories (
  post_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, category_id),
  INDEX idx_post_categories_category (category_id),
  CONSTRAINT fk_post_categories_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preserve every existing post's current category.
INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT id, category_id FROM posts;
