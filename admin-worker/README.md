# BooksUp Admin – secure publishing backend (optional)

BooksUp **never grants admin rights from a local username, a switch or an editable app file**.

The Cloudflare Worker in `admin-worker/worker.mjs` signs users in through a real GitHub OAuth app, verifies the identity returned by `GET https://api.github.com/user`, and permits publication **only** when the verified login is `lavender1510` (and when configured, the account's immutable GitHub user ID matches `ADMIN_GITHUB_ID`).

## Publisher setup (must be completed to activate admin features)

1. Create a GitHub OAuth App in [GitHub Developer Settings](https://github.com/settings/developers) with the exact HTTPS callback `https://YOUR-WORKER.example/auth/callback`. Do **not** bundle the OAuth secret with the app.
2. Deploy `admin-worker/worker.mjs` using a Cloudflare Worker (or compatible secure server runtime). Create a Cloudflare KV binding named `SESSIONS` to store short-lived OAuth state and 4-hour authenticated sessions.
3. Store `CLIENT_ID`, `CLIENT_SECRET`, `GITHUB_PUBLISH_TOKEN`, `ADMIN_LOGIN=lavender1510`, and preferably the numeric `ADMIN_GITHUB_ID` in backend environment variables/secrets. The publishing token needs **Contents: Read and write** for **only** `lavender1510/BooksUp` and may only be used on the server.
4. In `www/booksup-admin-config.js`, configure the PUBLIC Worker URL as `window.BOOKSUP_ADMIN_API_URL = 'https://YOUR-WORKER.example';`. Commit that URL (not secrets) and rebuild Android and Windows.
5. Test authorization from both `lavender1510` and a different GitHub account. The second must receive **403/401** for publication. Perform news and book metadata publishing tests.

The service writes editor additions to `www/admin-news.json` and `www/admin-books.json`. The mobile/desktop app reads these public files as metadata. Individual users' books, reading progress, private age and backup contents are never published by this service.

### Security limitations

This is a backend deployment scaffold. The repository alone does **not** authenticate admins; no backend or GitHub OAuth client is auto-created. Before public deployment, review session handling, input validation, rate limits, logging and content policy with a security professional. Replace temporary personal-account publishing credentials with a scoped GitHub App where feasible.

## Age and recommendation metadata

The BooksUp age field is stored in local app data and therefore also appears in user-exported ZIP backups. It is not displayed on public profiles or transmitted to the publishing Worker. Online book catalog APIs usually do not supply dependable age ratings. For under-18 accounts BooksUp restricts recommendations conservatively, but it cannot promise perfect age classification or identity verification.

## News and metadata

Administrator article and catalog entries are public repository data; do not publish private information, copyrighted full text or unsupported claims. Published books only fill currently missing fields on local books; user-entered data is not overwritten.
