-- Add a distinct audit type for quiz publication notifications.
ALTER TABLE push_notification_logs
  MODIFY notification_type ENUM('new_post','post_update','manual','quiz_new') NOT NULL;
