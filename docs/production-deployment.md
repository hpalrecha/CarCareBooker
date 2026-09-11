# Production deployment

Only pushes to `main` trigger the production workflow. The workflow deploys the
immutable GitHub commit SHA that triggered it; it never runs `git pull` or
deploys the server's current branch.

## One-time host configuration

The host needs a non-secret configuration file at
`/etc/carcarebooker-deploy.env`, readable by the deployment command:

```bash
P91_REPOSITORY_DIR=/home/ubuntu/CarCareBooker
P91_ENV_FILE=/root/carcarebooker.env
P91_PUBLIC_HEALTH_URL=https://p91carcare.com/api/business-hours
# Optional. Must be an unused localhost port.
P91_CANDIDATE_PORT=18084
# Optional. Host directory for persistent user uploads.
P91_UPLOADS_DIR=/root/carcare-uploads
```


The existing production environment file remains on the host. Do not put it
in GitHub or this repository. The deployment account needs non-interactive
permission to run the deployment script with Docker; scope that sudo rule to
the deployment script rather than granting unrestricted access where possible.

## Required GitHub Actions secrets

- `LIGHTSAIL_SSH_HOST`
- `LIGHTSAIL_SSH_USER`
- `LIGHTSAIL_SSH_PRIVATE_KEY`
- `LIGHTSAIL_SSH_KNOWN_HOSTS`

Use the `production` GitHub Environment and protect it with required reviewers
for the first deployment if desired.

## Deployment sequence

1. GitHub checks out, tests, and builds the pushed `main` SHA.
2. Lightsail fetches and checks out that exact SHA in a detached worktree.
3. Docker builds `carcarebooker:<sha>` with the revision label.
4. A candidate container runs on a temporary localhost port and must pass its
   Docker health check and `/api/business-hours` response check.
5. Only then is the fixed-port container replaced. Nginx remains unchanged at
   `127.0.0.1:8084` to container port `5000`.
6. The replacement API and configured public `/api/business-hours` URL are
   checked for both HTTP success and expected business-hours data.

Because Nginx points at a single fixed port, the final container switch has a
short interruption while Docker stops the old container and binds the port.
The candidate checks reduce, but cannot eliminate, that small cutover window.

## Failure and rollback

If the image build or candidate checks fail, the current production container
is untouched. The previous image is tagged `carcarebooker:prev` before the
switch. If a post-switch check fails, the script attempts to restart that
previous image automatically.

For a later manual rollback, use the approved host deployment procedure to
start `carcarebooker:prev` with the same env file and port mapping; do not
delete the current image until the rollback is verified.
