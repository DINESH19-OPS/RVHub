Render Deployment Notes

Recommended Render settings
- Service type: Web Service
- Environment: Node
- Branch: main (or your production branch)

Build Command (recommended)

npm ci --legacy-peer-deps && npm run build

Notes:
- `npm ci` installs dependencies from package-lock.json reproducibly. Use `--legacy-peer-deps` only if you see ERESOLVE peer dependency issues on Render (we previously resolved an upstream peer conflict by updating `better-auth`).
- If you commit an updated `package-lock.json` (generated from a clean `npm ci` locally), you can switch to `npm ci && npm run build` without `--legacy-peer-deps`.

Start Command (recommended)

npm run start

(or explicitly)

npx next start -p $PORT

Why these commands
- `npm run build` runs `next build` (defined in `package.json`).
- Render sets the $PORT environment variable. `next start` auto-uses $PORT; the explicit `-p $PORT` variation ensures correct port binding.

Node version
- This repo includes an `engines.node` entry in `package.json` set to `18.x`. In Render's service settings, pick Node 18 to match.

Peer dependency / install notes
- If Render's build fails with `ERESOLVE` complaining about peer dependencies, include `--legacy-peer-deps` in the Build Command or resolve the upstream package versions locally, commit the lockfile, and re-deploy.

Security & audit
- We saw a small number of moderate vulnerabilities after install. Run `npm audit` locally and decide whether to apply fixes. `npm audit fix --force` may introduce breaking changes.

Optional: Docker
- You can also deploy using Docker by creating a Dockerfile that runs `npm ci --legacy-peer-deps`, `npm run build`, and then `npx next start -p $PORT`.

If you want, I can:
- Commit these changes to `main` and push to your remote (I can prepare a sensible commit message),
- Generate a small Dockerfile for Render's Docker deploy, or
- Create a small `render.yaml` deploy blueprint (if you want an IaC-style manifest).
