# Web Push Notifications — Retired

The JharResult web push notification feature has been removed from the application.

- The visitor opt-in prompt and service worker have been removed.
- Push subscription and manual notification API routes have been removed.
- Automatic notifications for posts, scheduled posts, quizzes, and previous-year papers have been removed.
- The admin dashboard no longer offers manual post notifications.

The old migrations `004_web_push_notifications.sql`, `005_quiz_push_notifications.sql`, and `006_previous_paper_push_notifications.sql` are retained as historical migration records. They are not required by the current application.

If those migrations were previously applied to the JharResult database, run `database/migrations/007_remove_web_push_notifications.sql` in phpMyAdmin to remove the unused push subscription and notification log tables.

After confirming the feature is removed from the deployed site, you may delete these unused Hostinger environment variables: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`. Do not remove unrelated SMTP/email variables.
