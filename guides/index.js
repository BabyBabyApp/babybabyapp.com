const filters = document.querySelector('.guide-filters');
const list = document.querySelector('.guides-list');
const count = document.querySelector('.guides-count');

if (filters && list && count) {
  const cards = [...list.querySelectorAll('.guide-card')];
  const buttons = [...filters.querySelectorAll('button')];
  const updateCount = () => {
    const total = cards.filter((card) => !card.hidden).length;
    count.textContent = `${total} ${total === 1 ? 'guide' : 'guides'}`;
  };

  filters.hidden = false;
  updateCount();
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-topic]');
    if (!button || !filters.contains(button)) return;
    const topic = button.dataset.topic;
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    list.dataset.filtered = String(topic !== 'all');
    cards.forEach((card) => { card.hidden = topic !== 'all' && card.dataset.topic !== topic; });
    updateCount();
  });
}
