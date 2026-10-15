# Procord — GitHub Pages + Supabase Auth

This is the static-hosting version of Procord. GitHub Pages serves the HTML/CSS/JavaScript; Supabase handles real user accounts, password storage, email verification, sessions, and password recovery. No Node.js server or database file is hosted on GitHub Pages.

## 1. Create a Supabase project

1. Sign in at https://supabase.com/ and create a new project.
2. Open **Project Settings → API** (the labels may change slightly).
3. Copy the **Project URL** and the **anon/public key**. Do not use or publish the `service_role` key.
4. Open `js/config.js` and replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with those two public values.

The anon/public key is designed for frontend use. Security still depends on Supabase Auth settings and database Row Level Security (RLS) for any tables you add later. Never add a service-role key to this repository.

## 2. Set redirect URLs in Supabase

After you publish the site, copy its exact URL. For a project repository it often looks like `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`; for a repository named `YOUR-USERNAME.github.io`, it often looks like `https://YOUR-USERNAME.github.io/`.

In Supabase, open **Authentication → URL Configuration**:

- Set **Site URL** to your published Procord base URL.
- Add these URLs to **Redirect URLs** (replace the example values with your real GitHub username/repository):
  - `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/verify-email.html`
  - `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/reset-password.html`
  - If testing locally, add the exact local URL you use for each page, such as `http://localhost:5500/verify-email.html` and `http://localhost:5500/reset-password.html`.

The site URL must match your real GitHub Pages URL. Do not leave the example placeholders in Supabase.

## 3. Configure email authentication

In **Authentication → Sign In / Providers** (or the current Email provider settings), enable Email sign-in and email confirmations. In **Authentication → Email Templates**, keep the confirmation and password-recovery templates using the Supabase-provided confirmation/recovery link variables. Supabase’s default email sender is suitable for initial testing but has sending limits; configure custom SMTP in Supabase for reliable production delivery.

The confirmation link should return users to the configured `verify-email.html` redirect, and the password recovery link should return users to `reset-password.html`. Test both flows with an email address you control.

## 4. Publish with GitHub Pages

1. Upload the contents of this folder to the root of your GitHub repository (so `index.html`, `js/`, and `css/` are at the repository root).
2. Commit and push.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select your default branch (usually `main`) and folder **/(root)**, then save.
5. Wait for deployment, open the published URL, and test signup, email verification, login, dashboard, sign-out, and password recovery.

`index.html` redirects to `login.html`. Relative links are used so it works when the repository is published under a subpath.

## Included features

- Responsive dark glassmorphism Procord authentication UI
- Sign-up with email confirmation
- Email/password sign-in
- Password recovery and password update
- Protected dashboard and sign-out
- Browser-side password-strength checks and show/hide password buttons
- Terms and privacy starter pages

## Important limitations

- **Login notification emails:** this static version does not send a separate email every time someone signs in. Sending custom notifications securely requires a trusted server-side function (for example a Supabase Edge Function with an Auth Hook) and careful abuse protection. Never place SMTP credentials or a Supabase service-role key in browser JavaScript.
- **No chat platform yet:** this is the authentication starter only; it does not implement Discord-style chat, servers, channels, friends, or messaging.
- **Terms and privacy:** these are starter templates, not legal advice. Customize them before public launch.
- **Production:** use custom SMTP, test redirects, review Supabase Auth security settings, and follow current Supabase guidance.

## Local preview

For ES modules, open the folder using VS Code Live Server or another local static server. Avoid opening `index.html` directly as a `file://` URL. Add the exact local verification/reset URLs to Supabase Redirect URLs while testing.
