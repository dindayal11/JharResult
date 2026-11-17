-- JharResult: add a dedicated rich article body without changing existing SEO fields.
-- Run once in the production MySQL database (phpMyAdmin or MySQL client).
ALTER TABLE posts
  ADD COLUMN content_html MEDIUMTEXT NULL AFTER short_description;
