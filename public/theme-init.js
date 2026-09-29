/*
 * Applies the stored colour theme before first paint.
 *
 * This lives in an external file rather than an inline <script> for one reason:
 * an inline script needs either a nonce or a hash in the Content Security
 * Policy, and on a static host there is no per-request nonce to issue. Moving
 * nineteen lines to a file lets the policy be `script-src 'self'` with no
 * exceptions at all, which is a stronger policy than a hash would be.
 *
 * It is a blocking script in <head>, not deferred: it has to run before the
 * first paint or the page flashes the wrong theme. It is same-origin and a few
 * hundred bytes, on a connection the stylesheet is already using.
 */
(function () {
  var root = document.documentElement;

  // The scroll-reveal hidden state is gated on this class. Setting it here,
  // before first paint, means nothing flashes in at full opacity first — and a
  // visitor without JavaScript simply never gets the hidden state, so they see
  // the finished page rather than a blank one.
  root.classList.add('has-js');

  var theme = 'dark';
  try {
    var stored = localStorage.getItem('hilbras-theme');
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
  } catch (error) {
    // Storage can be blocked entirely, in which case the system preference above
    // never runs either. Dark is the documented default.
    theme = 'dark';
  }

  root.dataset.theme = theme;
})();
