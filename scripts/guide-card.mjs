const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function renderGuideCard(entry, html) {
  const date = html.match(/<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1];
  const readingTime = html.match(/\b\d+ min read\b/)?.[0];
  const topic = /MEMOR|BOOK/.test(entry.category) ? 'memories'
    : /^(PLAY|GROWTH|COMMUNICATION)/.test(entry.category) ? 'growing' : 'care';
  const displayDate = date ? new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`)) : '';
  const title = escapeHtml(entry.title);
  return `<article class="guide-card" data-topic="${topic}">
  <div class="guide-card-heading"><p class="guide-card-category">${escapeHtml(entry.category)}</p><span class="guide-card-latest">Latest guide</span></div>
  <h3><a href="${entry.slug}/">${title}</a></h3>
  <p class="guide-card-summary">${escapeHtml(entry.summary)}</p>
  <div class="guide-card-footer"><p class="guide-card-meta">${date ? `<time datetime="${date}">${displayDate}</time>` : ''}${readingTime ? `<span>${readingTime}</span>` : ''}</p><a class="guide-card-link" href="${entry.slug}/" aria-label="Read the guide: ${title}">Read the guide <span aria-hidden="true">↗</span></a></div>
</article>`;
}
