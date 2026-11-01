<<<<<<< HEAD
# JharResult — Hostinger MySQL edition

A Jharkhand-focused jobs, results, admit cards, admissions and scholarship portal.
Built with Next.js App Router and Hostinger MySQL/MariaDB. No Supabase, FastAPI or Docker.

## 1. Local setup (Windows PowerShell)

1. Install Node.js 22 LTS or 24.
2. Extract this ZIP and open the project folder in VS Code.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local` and fill in your MySQL credentials and secrets.
5. Create a MySQL database and import `database/schema.sql` using phpMyAdmin.
6. Run `npm run db:setup` to create/update the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
7. Run `npm run dev`, then open http://localhost:3000.

## 2. Hostinger database setup

In hPanel open **Websites → Manage → Databases → Management**. Create a MySQL database and database user, assign the user to the database with all required privileges, then open phpMyAdmin and import `database/schema.sql`.

Use these values in the Node.js app environment:
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: exact values shown in hPanel
- `AUTH_SECRET`: long random secret (32+ characters)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: a strong admin login
- AI variables only if you want AI extraction.

Hostinger may display a database username/name with an account prefix. Copy the complete value exactly.

## 3. Deploy on Hostinger

Use hPanel's Node.js/Web App deployment flow (not a static HTML upload). Upload the extracted project ZIP or deploy from GitHub, select a supported Node.js version (22 or 24), install dependencies and build the Next.js app. Add the environment variables from `.env.example` in the app settings, then start the app using `npm start` (or the start command shown by hPanel). Attach your new JharResult domain to this app. This project does not modify toolsmandal.in.

If your Hostinger plan's Node.js deployment screen does not offer Next.js or ZIP upload, check plan eligibility with Hostinger before changing DNS.

## 4. Admin

Visit `/admin/login`. The first admin is created with `npm run db:setup` after the database schema is imported. Change the example password before exposing the site publicly.

Admin can create posts in Manual mode or paste a notice into AI mode. AI output is a draft only. Verify every fact against the official notice before publishing.

## 5. Important limitations

- AI extraction requires a valid OpenAI-compatible API key and may incur provider charges.
- PDF extraction supports text-based PDFs. Scanned/image-only PDFs need OCR and are not supported in this starter.
- The initial AI mode accepts pasted notice text. PDF extraction API is included for text PDFs, but a PDF upload control is not included in this first admin UI.
- This is a functional starter, not a completed security audit. Before public launch add rate limiting, email/password reset, audit logs, backups, monitoring, and test the deployment.
- Never publish unverified AI output. Missing facts are returned as blank/unknown, not guessed.
=======
# JharResult
>>>>>>> be8409c3592c27c78083c9377ae4e177f1e155dc
