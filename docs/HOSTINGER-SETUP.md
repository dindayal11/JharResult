# Hostinger deployment checklist

- [ ] Create a separate domain/subdomain for JharResult; leave toolsmandal.in untouched.
- [ ] In hPanel create a Node.js web app and select Node 22 or 24.
- [ ] Create MySQL database + user under Databases; grant privileges.
- [ ] Import `database/schema.sql` using phpMyAdmin.
- [ ] Upload project ZIP or deploy from GitHub.
- [ ] Set all environment variables from `.env.example` in the Node app configuration.
- [ ] Run `npm install` and `npm run build` using the hPanel deployment flow.
- [ ] Run `npm run db:setup` once to seed the admin account (if the hPanel terminal is available).
- [ ] Start with `npm start`.
- [ ] Add a test draft, verify admin login, publish a test post, and check public page/search/category.
- [ ] Enable SSL and confirm HTTPS before sharing the site.

If hPanel offers a different startup command or build workflow for your selected plan, follow the values shown there. Never put database passwords, auth secret or AI key in client-side variables (`NEXT_PUBLIC_*`).
