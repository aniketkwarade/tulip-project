# Contributing to TULIP

Thank you for helping improve TULIP. Small, reviewable changes with explicit
evidence and scope are the easiest to validate.

## Development setup

```bash
npm ci
cp .env.local.example .env.local
npm run dev:full
```

Do not commit `.env.local`, API keys, Vercel state, generated build directories,
or source material that cannot be redistributed.

## Before opening a pull request

```bash
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

If a test rewrites generated registry artifacts, include them only when the
change intentionally updates the underlying methodology or source inputs.

## Evidence and relationship changes

Changes to evidence, metrics, scores, or graph relationships should identify:

- the exact source URL and locator;
- the claim or mechanism supported by that source;
- geography, time period, units, and transformation;
- uncertainty and meaningful counterevidence;
- whether the source is observational, modeled, assessed, or contextual; and
- every generated registry or review artifact that must remain synchronized.

Do not infer causal strength from citation count, graph degree, or source
prestige alone.

## Security and conduct

Follow [`SECURITY.md`](SECURITY.md) for vulnerability reports. Be respectful,
specific, and evidence-led in issues and reviews. Harassment, discrimination,
or disclosure of another person's private information is not acceptable.
