# Production release pipeline

## Contract

GitHub `main` is the source of truth for production. Vercel project
`thetulipproject/tulip-project` watches that branch, builds the Vite application,
and moves the stable alias <https://tulip-project-six.vercel.app/> to the ready
production deployment.

Neither the ignored local `dist/` directory nor a Vercel preview deployment is
a release source. They are verification surfaces for the same checked-in source.

## Release flow

1. Review the complete local working tree and select the intended release files.
2. Run the local gate:

   ```bash
   npm ci
   npm run release:check
   ```

3. Push the verified candidate on a `codex/` release branch and open a pull
   request into `main`.
4. Wait for the required `release-checks` and `Vercel` checks.
5. Squash-merge into `main`. Vercel's Git integration creates the production
   deployment; do not create a second deployment with `vercel --prod`.
6. Verify all of the following before calling the release complete:

   - the pull request's merge commit is the current GitHub `main` commit;
   - the newest ready Vercel production deployment records that commit as
     `githubCommitSha`;
   - `vercel inspect tulip-project-six.vercel.app` resolves to that deployment;
   - `https://tulip-project-six.vercel.app/` returns a successful HTTP response.

## Failure behavior

- A local gate failure means nothing is pushed.
- A pull-request check failure means nothing is merged.
- A Vercel build failure leaves the previous ready production deployment live.
- A commit, deployment, or alias mismatch means the release is still in
  progress; investigate it instead of deploying a separate artifact manually.

This procedure is also recorded in the repository's `AGENTS.md` so future Codex
sessions interpret a request to push or publish as the entire verified release,
not merely a `git push` command.
