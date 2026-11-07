-- Run once on the JharResult database before deploying scheduled publishing.
ALTER TABLE posts
  MODIFY COLUMN status ENUM('draft','published','scheduled') NOT NULL DEFAULT 'draft',
  ADD COLUMN scheduled_at DATETIME NULL AFTER published_at;

CREATE INDEX idx_posts_scheduled ON posts (status, scheduled_at);
