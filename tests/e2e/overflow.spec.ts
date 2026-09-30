import { expect, test } from './fixtures';
import { products } from '../../src/data/areas';

/**
 * Nothing may be wider than the viewport it is shown in.
 *
 * This exists because of a real bug: the product cards on a product page were
 * 460px wide inside a 280px container at every phone width, and ran off the
 * right edge with no way to reach the content. A grid item's automatic minimum
 * size is its min-content size, and a `truncate` span inside it is
 * `white-space: nowrap`, so the min-content width is the whole unwrapped string.
 * The track grows to fit, and the card overflows.
 *
 * The one-line fix is `min-w-0` on the grid item, and it had already been written
 * for the footer — which is why the bug was easy to miss and the footer the one
 * list that was correct.
 *
 * 320px is the narrowest phone still in use, and below Tailwind's `sm`
 * breakpoint every one of these lists is a single column, which is exactly where
 * an unshrinkable card has the least room to be unshrinkable.
 */
const VIEWPORTS = [320, 360, 480] as const;

test.describe('no horizontal overflow', () => {
  for (const width of VIEWPORTS) {
    test(`nothing overflows at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });

      for (const slug of ['', ...products.map((product) => product.id)]) {
        const route = slug ? `/products/${slug}` : '/products';
        await page.goto(route, { waitUntil: 'load' });

        // Fire the scroll reveals, or every card below the fold is still
        // mid-transform and its own box is not yet the box a reader sees.
        await page.evaluate(async () => {
          const step = Math.round(window.innerHeight * 0.6);
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo({ top: y, behavior: 'instant' });
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
        await page.waitForTimeout(300);

        const overflow = await page.evaluate((viewportWidth) => {
          // A scrollable container is allowed to have wider content — that is
          // what makes a long shell command readable. Its own box must still fit.
          const inScroller = (node: Element) => {
            for (let el = node.parentElement; el; el = el.parentElement) {
              const overflowX = getComputedStyle(el).overflowX;
              if (overflowX === 'auto' || overflowX === 'scroll') return true;
            }
            return false;
          };

          const offenders: string[] = [];
          const documentWidth = document.documentElement.scrollWidth;
          if (documentWidth > viewportWidth + 1) {
            offenders.push(`<html> scrolls horizontally: ${documentWidth}px in ${viewportWidth}px`);
          }

          for (const el of document.body.querySelectorAll('*')) {
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const past = Math.round(rect.right - viewportWidth);
            if (past > 1 && !inScroller(el)) {
              const classes = typeof el.className === 'string' ? el.className : '';
              offenders.push(
                `${el.tagName.toLowerCase()}${classes ? `.${classes.split(' ').slice(0, 3).join('.')}` : ''} ` +
                  `is ${past}px past the right edge`,
              );
            }
          }
          // One representative is enough to identify the problem in a failure.
          return offenders.slice(0, 5);
        }, width);

        expect(overflow, `${route} at ${width}px`).toEqual([]);
      }
    });
  }
});
