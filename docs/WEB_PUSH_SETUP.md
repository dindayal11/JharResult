# JharResult Web Push Notifications — Deployment Setup

The notification code is deployed from the GitHub `main` branch, but push delivery remains disabled until the database migration and VAPID environment variables below are configured.

## 1. Apply the database migration

In Hostinger hPanel, open phpMyAdmin for the JharResult database. Open the SQL tab and run the complete contents of:

`database/migrations/004_web_push_notifications.sql` and then `database/migrations/005_quiz_push_notifications.sql`

The first migration creates `push_subscriptions` and `push_notification_logs`. The second adds the `quiz_new` notification type to the audit log. Run them in numerical order. Do not run them against a different site's database.

## 2. Generate VAPID keys (Windows PowerShell)

Run this once in a local PowerShell terminal:

```powershell
node -e "const c=require('crypto');const e=c.createECDH('prime256v1');e.generateKeys();console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY='+e.getPublicKey().toString('base64url'));console.log('VAPID_PRIVATE_KEY='+e.getPrivateKey().toString('base64url'))"
```

Keep the private key secret. Do not commit it to GitHub or put it in any `NEXT_PUBLIC_` variable.

## 3. Add Hostinger environment variables

Add these variables to the JharResult Node.js application settings:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — public key printed by the command
- `VAPID_PRIVATE_KEY` — private key printed by the command (server-side only)
- `VAPID_SUBJECT` — `mailto:dindayal8456@gmail.com`

Save the settings and redeploy/restart the application so the build receives the public key and the server receives both keys.

## 4. How it works

- Visitors see an optional **Enable Notifications** prompt. The browser asks permission only after the visitor clicks it.
- A newly published post sends an automatic notification.
- Scheduled posts send a notification when the existing scheduled-publishing cron publishes them.
- Editing an already published post sends nothing by default. Tick **Send push notification for this update** only for an important update.
- The admin dashboard has **Send Notification** for a specific published post.
- Publishing a new quiz manually, publishing a draft quiz, or importing a class-wise quiz JSON sends an automatic notification. A bulk JSON import sends one combined notification for the imported quizzes, not one notification per quiz.
- Saving a quiz as a draft or editing an already published quiz does not send a notification. Re-publishing an already published quiz does not send another notification.
- Notification clicks open the relevant JharResult post.

## 5. Browser and policy notes

Push notifications require HTTPS and a browser that supports the Push API. Users can revoke permission in browser/site settings. Notifications contain post updates only; they do not contain AdSense ads or ad-click prompts.

## 6. Verification checklist

1. Confirm the migration tables exist in phpMyAdmin.
2. Confirm all three environment variables are saved in Hostinger.
3. Open `https://jharresult.in` in a supported browser and enable notifications using the explicit button.
4. Publish a test post and confirm the notification arrives.
5. Publish a test quiz and confirm the notification arrives; then import a small test JSON package and confirm it sends one combined notification.
6. Use the admin dashboard's **Send Notification** action on a published test post.
7. Verify post notification clicks open `/post/<slug>` and quiz notification clicks open `/quiz`.

If the site was already open before deployment, refresh it to load the new service worker and opt-in control.
