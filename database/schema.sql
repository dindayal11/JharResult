CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  category_id BIGINT UNSIGNED NOT NULL,
  short_description TEXT NULL,
  organization VARCHAR(190) NULL,
  notification_number VARCHAR(120) NULL,
  source_url VARCHAR(1000) NULL,
  application_url VARCHAR(1000) NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  verification_status ENUM('unverified','verified') NOT NULL DEFAULT 'unverified',
  important_dates JSON NULL,
  application_fee JSON NULL,
  age_limit JSON NULL,
  vacancy_details JSON NULL,
  qualification TEXT NULL,
  selection_process TEXT NULL,
  how_to_apply TEXT NULL,
  important_links JSON NULL,
  faqs JSON NULL,
  notice_text LONGTEXT NULL,
  seo_title VARCHAR(255) NULL,
  seo_description VARCHAR(320) NULL,
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_posts_status_date (status, published_at),
  INDEX idx_posts_category (category_id),
  FULLTEXT INDEX ft_posts_search (title, short_description, organization)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO categories (name, slug, description) VALUES
('Latest Jobs','latest-jobs','Latest Jharkhand government job notifications'),
('Admit Card','admit-card','Admit cards and exam hall tickets'),
('Results','results','Exam results and merit lists'),
('Answer Key','answer-key','Provisional and final answer keys'),
('Admissions','admissions','Admissions in Jharkhand institutions'),
('Scholarships','scholarships','Scholarship updates and applications'),
('Syllabus','syllabus','Exam syllabus and pattern'),
('Previous Papers','previous-papers','Previous year question papers'),
('Notifications','notifications','Official notices and updates');


CREATE TABLE IF NOT EXISTS post_categories (
  post_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, category_id),
  INDEX idx_post_categories_category (category_id),
  CONSTRAINT fk_post_categories_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
