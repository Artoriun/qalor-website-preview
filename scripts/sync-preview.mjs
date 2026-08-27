/**
 * Publish the public preview mirror.
 *
 * The preview is a plain branch push of this repository's `master` onto the mirror's `main`,
 * with one file held back: `.github/dependabot.yml`.
 *
 * That file has to stay out, and the reason is not tidiness. Dependabot reads it wherever it
 * finds it, so the mirror was running version updates of its own and opening pull requests
 * against a repository that is force-pushed from here — they can never reach this source, and
 * the next sync overwrites whatever they changed. Four of them accumulated on a repository
 * that is pinned on the owner's profile, two with failing checks, all of them unmergeable by
 * construction. The comment at the top of dependabot.yml already said updates belong here
 * rather than there; this is what makes that true instead of merely stated.
 *
 * Security *alerts* are unaffected — those are a repository setting, not this file, and they
 * are worth keeping on both.
 *
 * The sibling starter repos solve the same problem the same way: scripts/publish-target.mjs
 * assembles what it publishes and simply never includes their dependabot.yml.
 *
 *   npm run sync:preview
 */

import { execFileSync } from 'node:child_process';

const REMOTE = 'preview';
const WITHHELD = '.github/dependabot.yml';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

if (git('status', '--porcelain')) {
  console.error('Working tree is dirty. Commit or stash before syncing the preview.');
  process.exit(1);
}

const remotes = git('remote').split('\n');
if (!remotes.includes(REMOTE)) {
  console.error(
    `No '${REMOTE}' remote. Add it with:\n` +
      `  git remote add ${REMOTE} https://github.com/Artoriun/qalor-website-preview.git`,
  );
  process.exit(1);
}

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const source = git('rev-parse', '--short', 'master');

// Detached, so the temporary commit below can never land on a real branch.
git('checkout', '--detach', 'master');
try {
  git('rm', '--quiet', WITHHELD);
  git('commit', '--quiet', '-m', `Preview mirror of ${source}, without ${WITHHELD}`);
  execFileSync('git', ['push', '--force', REMOTE, 'HEAD:main'], { stdio: 'inherit' });
  console.log(`\nPushed ${source} to ${REMOTE}/main, holding back ${WITHHELD}.`);
} finally {
  // Back to where we started even if the push fails, so a bad run leaves no detached HEAD.
  git('checkout', branch);
}
