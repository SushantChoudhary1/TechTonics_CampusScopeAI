# Feedback cleanup activation

CampusScope AI keeps the supplied student and administrator experiences unchanged. Feedback is visible to an authorized administrator until its expiry time. The first authorized opening of a feedback detail calls the server-side review procedure, which writes `viewedAt` and one fixed `expiresAt` exactly seven days later only when `viewedAt` is still empty. Later openings do not update either timestamp. Queries exclude rows whose `expiresAt` has elapsed.

Expired rows are removed independently of portal visits by the authenticated callback `POST /api/scheduled/cleanup-feedback`. The callback accepts only hosted scheduler identities, deletes feedback with an elapsed `expiresAt`, and returns an idempotent JSON result. It is mounted before the Vite/static fallback and does not use an in-process timer.

## Activation after deployment

The site must be deployed first so the hosted scheduler can reach the production URL. After deployment, create one project-level hosted cleanup job using the project owner identity:

```sh
manus-heartbeat create \
  --name campus-scope-feedback-cleanup \
  --cron "0 0 * * * *" \
  --path /api/scheduled/cleanup-feedback \
  --description "Delete CampusScope feedback whose seven-day post-view expiry has elapsed"
```

The cron expression runs hourly in UTC. The hosted scheduler persists independently of browser sessions and sandbox availability. If the job needs to be changed later, use its returned `task_uid` with the hosted scheduler’s update or pause controls; do not identify it by name in application code.

For local validation, the endpoint remains protected and should not be called with an ordinary browser session. After deployment and activation, confirm the first scheduled run in the scheduler execution history. The administrator portal itself does not need to remain open for cleanup to occur.
