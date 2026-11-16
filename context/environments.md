# Environments - Courier Booking Platform

## The Environments

| Environment | Purpose | Cloud account | Who deploys | Data |
|---|---|---|---|---|
| `development` | Local development, testing new features | Local | Developer | Synthetic / local Supabase |
| `staging` | QA testing, UAT | Vercel staging project | Tech lead | Anonymized prod data |
| `production` | Live customers | Vercel production | Humans only | Real customer data |

## Hard Rules

- **Never point a non-production stack at production data.** Not to reproduce a bug, not temporarily, not read-only
- Changes go to the lowest environment that can prove them, and are promoted upward
- An environment-specific value lives in that environment's variables file — never in a conditional inside shared code
- **Agents never deploy.** An agent produces a plan; a human applies it

## Promotion Path

```
development → staging → production
```

| Hop | Requirements | Who signs off |
|---|---|---|
| dev → staging | Tests green, code reviewed | Tech lead |
| staging → production | UAT passed, CI green | Product owner |

## Access

| Environment | Who has write access | How access is granted | How it is revoked |
|---|---|---|---|
| `development` | Developers | GitHub team membership | Remove from team |
| `staging` | Tech leads | Vercel project access | Remove from project |
| `production` | Team lead, designated deployer | Vercel production access, 2FA | Remove from project |

## Observability

| Environment | Logs | Metrics | Alerting | On-call |
|---|---|---|---|---|
| `development` | Console | None | None | N/A |
| `staging` | Vercel logs | Vercel analytics | Slack alerts | Rotation |
| `production` | Vercel logs + Sentry | Vercel + Datadog | PagerDuty | On-call rotation |

## Cost

| Environment | Cost | Lifecycle |
|---|---|---|
| `development` | $0 (local) | Per-PR |
| `staging` | ~$20/mo (Vercel Pro) | Always-on |
| `production` | ~$20/mo (Vercel Pro) + usage | Always-on |

Supabase costs are separate (free tier for dev, paid for prod).