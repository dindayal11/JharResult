-- JharResult Quiz Zone
-- Apply once to the production MySQL database before enabling quiz APIs.

CREATE TABLE IF NOT EXISTS quiz_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  category_type ENUM('jac_board','competitive') NOT NULL,
  description VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_categories_parent FOREIGN KEY (parent_id) REFERENCES quiz_categories(id) ON DELETE SET NULL,
  INDEX idx_quiz_categories_parent (parent_id, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quizzes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(240) NOT NULL UNIQUE,
  description TEXT NULL,
  instructions TEXT NULL,
  question_count INT UNSIGNED NOT NULL DEFAULT 20,
  duration_minutes INT UNSIGNED NOT NULL DEFAULT 20,
  marks_per_question DECIMAL(7,2) NOT NULL DEFAULT 1.00,
  negative_marking DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  language ENUM('both','hindi','english') NOT NULL DEFAULT 'both',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quizzes_category FOREIGN KEY (category_id) REFERENCES quiz_categories(id),
  INDEX idx_quizzes_category_status (category_id, status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT UNSIGNED NOT NULL,
  question_text TEXT NOT NULL,
  question_text_hi TEXT NULL,
  explanation TEXT NULL,
  explanation_hi TEXT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_quiz_questions_pool (quiz_id, is_active, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  option_text TEXT NOT NULL,
  option_text_hi TEXT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_quiz_options_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
  INDEX idx_quiz_options_question (question_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_participants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(80) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quiz_participant_name (display_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  quiz_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  participant_id BIGINT UNSIGNED NOT NULL,
  status ENUM('in_progress','submitted','expired','invalid') NOT NULL DEFAULT 'in_progress',
  total_questions INT UNSIGNED NOT NULL,
  total_marks DECIMAL(9,2) NOT NULL DEFAULT 0,
  score DECIMAL(9,2) NOT NULL DEFAULT 0,
  correct_count INT UNSIGNED NOT NULL DEFAULT 0,
  wrong_count INT UNSIGNED NOT NULL DEFAULT 0,
  unanswered_count INT UNSIGNED NOT NULL DEFAULT 0,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  started_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  submitted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  CONSTRAINT fk_quiz_attempts_category FOREIGN KEY (category_id) REFERENCES quiz_categories(id),
  CONSTRAINT fk_quiz_attempts_participant FOREIGN KEY (participant_id) REFERENCES quiz_participants(id),
  INDEX idx_quiz_attempts_leaderboard (category_id, status, score, submitted_at),
  INDEX idx_quiz_attempts_participant (participant_id, quiz_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_attempt_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  question_order INT UNSIGNED NOT NULL,
  option_order JSON NOT NULL,
  CONSTRAINT fk_attempt_questions_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_questions_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id),
  UNIQUE KEY uq_attempt_question (attempt_id, question_id),
  UNIQUE KEY uq_attempt_question_order (attempt_id, question_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  selected_option_id BIGINT UNSIGNED NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  marks_awarded DECIMAL(9,2) NOT NULL DEFAULT 0,
  answered_at DATETIME NULL,
  CONSTRAINT fk_quiz_answers_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_answers_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id),
  CONSTRAINT fk_quiz_answers_option FOREIGN KEY (selected_option_id) REFERENCES quiz_options(id),
  UNIQUE KEY uq_quiz_answer (attempt_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order) VALUES
(NULL,'JAC Board','jac-board','jac_board','Class-wise Jharkhand Academic Council practice quizzes',1),
(NULL,'Competitive Exams','competitive-exams','competitive','Jharkhand competitive examination practice quizzes',2);

INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'Class 8','class-8','jac_board','JAC Board Class 8 practice quizzes',1 FROM quiz_categories WHERE slug='jac-board';
INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'Class 9','class-9','jac_board','JAC Board Class 9 practice quizzes',2 FROM quiz_categories WHERE slug='jac-board';
INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'Class 10','class-10','jac_board','JAC Board Class 10 practice quizzes',3 FROM quiz_categories WHERE slug='jac-board';
INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'Class 11','class-11','jac_board','JAC Board Class 11 practice quizzes',4 FROM quiz_categories WHERE slug='jac-board';
INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'Class 12','class-12','jac_board','JAC Board Class 12 practice quizzes',5 FROM quiz_categories WHERE slug='jac-board';

INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'JSSC','jssc','competitive','Jharkhand Staff Selection Commission practice quizzes',1 FROM quiz_categories WHERE slug='competitive-exams';
INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'JTET','jtet','competitive','Jharkhand Teacher Eligibility Test practice quizzes',2 FROM quiz_categories WHERE slug='competitive-exams';
INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'JPSC','jpsc','competitive','Jharkhand Public Service Commission practice quizzes',3 FROM quiz_categories WHERE slug='competitive-exams';
INSERT IGNORE INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order)
SELECT id,'Jharkhand Police','jharkhand-police','competitive','Jharkhand Police recruitment practice quizzes',4 FROM quiz_categories WHERE slug='competitive-exams';
