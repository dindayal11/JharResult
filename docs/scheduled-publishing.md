# Scheduled post publishing

1. Run `database/migrations/002_scheduled_posts.sql` once against the JharResult MySQL database.
2. Add a strong random environment variable named `CRON_SECRET` (at least 32 characters) to the production environment and redeploy.
3. In Hostinger hPanel, open **Advanced → Cron Jobs** and add a command to run every minute:

```sh
curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" "https://YOUR-JHARRESULT-DOMAIN/api/cron/publish-scheduled" >/dev/null
```

Replace both placeholders. Keep the secret private and do not put it in frontend code or a public repository.
4. Create a post, choose **Schedule for Later**, select a future date and time, and save. It remains hidden from public pages until the cron job runs after that time.

The endpoint returns the number of posts published. It rejects requests without the matching bearer secret.