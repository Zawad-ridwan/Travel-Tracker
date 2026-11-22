// Applies the saved theme before the page paints, so there is no white flash in dark mode.
// Kept in its own file (not inline in index.html) so the strict Content Security Policy allows it.
(function () {
  try {
    var saved = localStorage.getItem('tt-theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {
    // Storage blocked: fall back to the light theme
  }
})();
