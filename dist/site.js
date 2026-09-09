'use strict';
const film = document.getElementById('brand-film');
const soundButton = document.getElementById('watch-sound');
if (film && soundButton) {
  // Begin silently only when the visitor has not requested less motion or data.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && !navigator.connection?.saveData) {
    film.muted = true;
    film.play().catch(() => {});
  }
  soundButton.addEventListener('click', async () => {
    film.currentTime = 0;
    film.muted = false;
    film.volume = 1;
    try { await film.play(); } catch { film.focus(); }
  });
  film.addEventListener('ended', () => { soundButton.firstChild.textContent = 'Watch again with sound '; });
}
const quotes = [...document.querySelectorAll('.quote')];
let selectedQuote = 0;
document.querySelectorAll('[data-quote]').forEach(button => {
  button.addEventListener('click', () => {
    if (!quotes.length) return;
    quotes[selectedQuote].hidden = true;
    selectedQuote = (selectedQuote + Number(button.dataset.quote) + quotes.length) % quotes.length;
    quotes[selectedQuote].hidden = false;
    document.getElementById('quote-count').textContent = `${selectedQuote + 1} / ${quotes.length}`;
  });
});
