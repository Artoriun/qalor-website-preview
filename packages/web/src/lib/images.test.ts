import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ASSET_VERSION } from '@qalor/shared';
import { FULL_BLEED_W, fullBleedSrcSet, optimizeUrl } from './images';

/**
 * These transforms are the difference between a multi-megabyte original and a small WebP, and
 * a mistake is invisible: a URL that silently fails to match still loads the image, just the
 * original one. The byte budget catches that in aggregate; these pin the behaviour.
 *
 * The version segment is the other half. Without it the delivery URL is identical before and
 * after an image is replaced, so browsers keep serving what they already hold — see
 * ASSET_VERSION in @qalor/shared.
 */

const RAW = 'https://res.cloudinary.com/o5hr8kjc/image/upload/qalor/hero.jpg';
const VERSIONED = 'https://res.cloudinary.com/o5hr8kjc/image/upload/v1234/qalor/hero.jpg';

describe('optimizeUrl', () => {
  test('injects quality, width and the asset version, and swaps to WebP', () => {
    assert.equal(
      optimizeUrl(RAW, 400),
      `https://res.cloudinary.com/o5hr8kjc/image/upload/q_auto,w_400/${ASSET_VERSION}/qalor/hero.webp`,
    );
  });

  test('does not add a second version to a URL that already has one', () => {
    // Portal uploads come back from Cloudinary already versioned. Two version segments in one
    // path is a 404, and it would be served to every visitor who edited an image.
    const out = optimizeUrl(VERSIONED, 400);
    // Lookahead for the closing slash rather than consuming it: back-to-back segments like
    // `/v1786803387/v1234/` overlap on that slash, and a `/\/v\d+\//g` count reports 1 —
    // which is to say it reports "fine" for precisely the bug this test exists to catch.
    assert.equal(out.match(/\/v\d+(?=\/)/g)?.length, 1, `expected one version segment, got ${out}`);
    assert.ok(out.includes('/v1234/'), 'must keep the URL its own version');
  });

  test('rounds fractional widths, which Cloudinary rejects', () => {
    assert.ok(optimizeUrl(RAW, 411.75).includes('w_412'));
  });

  test('leaves URLs it cannot resize untouched', () => {
    for (const url of ['blob:http://localhost:3210/abc-123', '/placeholder.jpg', '']) {
      assert.equal(optimizeUrl(url, 800), url);
    }
  });
});

describe('fullBleedSrcSet', () => {
  test('offers ascending candidates, each versioned and matching its descriptor', () => {
    const entries = fullBleedSrcSet(RAW).split(', ');
    const widths = entries.map((e) => Number(e.split(' ')[1].replace('w', '')));
    assert.deepEqual(
      widths,
      [...widths].sort((a, b) => a - b),
      'must ascend',
    );
    for (const entry of entries) {
      const [url, descriptor] = entry.split(' ');
      assert.ok(url.includes(`w_${descriptor.replace('w', '')}/`), `${entry} must agree`);
      assert.ok(/\/v\d+\//.test(url), `${entry} must carry a version`);
    }
  });

  test('tops out at the full-bleed width, so no candidate exceeds what we upload', () => {
    const widths = fullBleedSrcSet(RAW)
      .split(', ')
      .map((e) => Number(e.split(' ')[1].replace('w', '')));
    assert.equal(Math.max(...widths), FULL_BLEED_W);
  });

  test('is empty for URLs that cannot be resized, so the plain src wins', () => {
    assert.equal(fullBleedSrcSet('blob:http://localhost:3210/abc'), '');
  });
});
