import { test as base, expect } from '@playwright/test';

/**
 * The suite's `test`, extended so that an uncaught error on the page fails the test that
 * caused it.
 *
 * Added because a real one shipped: five handlers in Navbar.tsx read `e.currentTarget`
 * inside a `setTimeout`, which React has already cleared by then, so every tap on the logo
 * threw `Cannot read properties of null` and left the logo stuck mid-animation. Every
 * assertion in the suite still passed — nothing was watching the console. A thrown error is
 * about the cheapest signal a browser gives you that something is wrong, and it was being
 * dropped on the floor.
 *
 * `auto: true` so specs get this by importing `test` from here rather than from
 * `@playwright/test`; no per-test opt-in to forget.
 */
// `void` is Playwright's own type for a fixture that provides no value, which is exactly
// what an auto fixture like this one is.
// biome-ignore lint/suspicious/noConfusingVoidType: idiomatic for a valueless Playwright fixture
export const test = base.extend<{ failOnPageError: void }>({
  failOnPageError: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors, 'uncaught error(s) on the page').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
