# TULIP repository instructions

## Production release contract

When the user asks to "push to GitHub", "publish", "ship", or otherwise make
the latest local TULIP build live, treat that as a request for the complete
release workflow below. A Git push by itself is not a completed release.

1. Treat the current working tree as the release candidate. `dist/` is a
   generated verification artifact and must not be committed or used as the
   source of truth.
2. Inspect every changed and untracked file. Include all intended application,
   public snapshot, documentation, and pipeline changes; never include secrets,
   `.vercel/`, local environment files, or unrelated user work.
3. Run `npm ci` when dependencies may be stale, followed by
   `npm run release:check`. Stop if any release check fails.
4. Fetch `origin/main`, put the verified candidate on a `codex/` release branch,
   commit the intended files, push the branch, and open a pull request against
   `main`. Do not push application releases directly to `main` and do not use
   `vercel --prod`; the Git integration is the production deploy authority.
5. Immediately enable squash auto-merge on the pull request. GitHub will merge
   once the required `release-checks` and `Vercel` checks pass; do not wait for
   the checks and then issue a separate manual merge request. Observe the pull
   request and `origin/main` to confirm the merge. If a GitHub merge command
   returns a 5xx response, inspect those authoritative states before retrying;
   the server may have accepted the merge despite the failed client response.
   Never create a duplicate pull request for the same commit merely to retry a
   merge. Refresh `origin/main` after the merge is confirmed.
6. Wait for Vercel to report a `READY` production deployment whose
   `githubCommitSha` is the new `main` commit. Confirm that
   `https://tulip-project-six.vercel.app/` is an alias of that deployment and
   returns a successful HTTP response.
7. Report the GitHub commit, pull request, production deployment URL, stable
   production URL, and verification result. If the merge, deployment, alias, or
   live check is incomplete, say the release is incomplete and keep working.

The permanent source-to-production path is:

`verified local source -> GitHub pull request -> main -> Vercel Git deployment -> tulip-project-six.vercel.app`

The expected happy-path release time is roughly one to two minutes: local gate,
one pull request with auto-merge armed, required checks, then the Vercel Git
deployment. Reopened pull requests and repeated workflow dispatches are recovery
tools, not normal release steps.
