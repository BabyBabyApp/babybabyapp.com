#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile, access, appendFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calendar = JSON.parse(await readFile(path.join(root, 'editorial/calendar.json'), 'utf8'));
const args = process.argv.slice(2);
const requestedSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const force = args.includes('--force');
const todayParts = new Intl.DateTimeFormat('en-US', {
  timeZone: calendar.timezone,
  year: 'numeric', month: '2-digit', day: '2-digit',
}).formatToParts(new Date());
const datePart = (type) => todayParts.find((part) => part.type === type).value;
const today = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;

const exists = async (file) => access(file).then(() => true, () => false);
const siteFile = (file) => path.join(root, file);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const displayDate = (date) => new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric',
}).format(new Date(`${date}T12:00:00Z`));

if (!Array.isArray(calendar.entries) || calendar.entries.length === 0) throw new Error('Guide calendar has no entries.');
const slugs = new Set();
for (const entry of calendar.entries) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) {
    throw new Error(`Invalid calendar entry: ${JSON.stringify(entry)}`);
  }
  if (slugs.has(entry.slug)) throw new Error(`Duplicate guide slug: ${entry.slug}`);
  if (entry.screenshot && (!entry.screenshot.src || !entry.screenshot.alt || !entry.screenshot.caption)) {
    throw new Error(`Screenshot needs a source, alt text, and sample-data caption: ${entry.slug}`);
  }
  slugs.add(entry.slug);
}

const entry = requestedSlug
  ? calendar.entries.find((item) => item.slug === requestedSlug)
  : calendar.entries.find((item) => item.date <= today && !slugsPublished(item));
if (requestedSlug && !entry) throw new Error(`Unknown guide slug: ${requestedSlug}`);
if (!entry) {
  console.log('No guide is due.');
  await setOutput({ published: 'false' });
  process.exit(0);
}
if (entry.date > today && !force) {
  console.log(`${entry.slug} is scheduled for ${entry.date}.`);
  await setOutput({ published: 'false' });
  process.exit(0);
}
if (await exists(siteFile(`guides/${entry.slug}/index.html`))) {
  console.log(`${entry.slug} is already published; no duplicate created.`);
  await setOutput({ published: 'false' });
  process.exit(0);
}

const publicationDate = today;
const guideUrl = `https://babybabyapp.com/guides/${entry.slug}/`;
const draftPath = entry.draft || `editorial/drafts/${entry.slug}.html`;
if (!await exists(siteFile(draftPath))) {
  throw new Error(`Due guide ${entry.slug} has no completed draft at ${draftPath}. Prepare and push the draft with Codex before publication.`);
}
let html = await readFile(siteFile(draftPath), 'utf8');
if (publicationDate !== entry.date) {
  html = html.replaceAll(entry.date, publicationDate).replaceAll(displayDate(entry.date), displayDate(publicationDate));
}
validateHtml(html, entry, guideUrl);

const guideRelative = `guides/${entry.slug}/index.html`;
await mkdir(path.dirname(siteFile(guideRelative)), { recursive: true });
await writeFile(siteFile(guideRelative), html);

const listingPath = siteFile('guides/index.html');
let listing = await readFile(listingPath, 'utf8');
const listStart = '<div class="guides-list prose">';
if (!listing.includes(listStart)) throw new Error('Could not find the guides listing container.');
if (listing.includes(`href="${entry.slug}/"`)) throw new Error(`Guide listing already contains ${entry.slug}.`);
const card = `<article class="guide-cta"><p class="eyebrow">${escapeHtml(entry.category)}</p><h2><a href="${entry.slug}/">${escapeHtml(entry.title)}</a></h2><p>${escapeHtml(entry.summary)}</p><a class="button" href="${entry.slug}/">Read the guide <span aria-hidden="true">↗</span></a></article>`;
listing = listing.replace(listStart, `${listStart}${card}`);
await writeFile(listingPath, listing);

const sitemapPath = siteFile('sitemap.xml');
let sitemap = await readFile(sitemapPath, 'utf8');
if (sitemap.includes(`<loc>${guideUrl}</loc>`)) throw new Error(`Sitemap already contains ${guideUrl}.`);
if (!sitemap.includes('</urlset>')) throw new Error('Could not find sitemap closing tag.');
sitemap = sitemap.replace('</urlset>', `<url><loc>${guideUrl}</loc></url>\n</urlset>`);
await writeFile(sitemapPath, sitemap);

await mkdir(path.dirname(siteFile(`dist/${guideRelative}`)), { recursive: true });
await copyFile(siteFile(guideRelative), siteFile(`dist/${guideRelative}`));
await copyFile(listingPath, siteFile('dist/guides/index.html'));
await copyFile(sitemapPath, siteFile('dist/sitemap.xml'));
await validateLocalLinks(siteFile(guideRelative));
await validateLocalLinks(listingPath);
console.log(`Prepared ${guideUrl}`);
await setOutput({ published: 'true', guide_url: guideUrl, slug: entry.slug });

function slugsPublished(item) {
  // This check is synchronous so the due-slot selection can remain deterministic.
  // Actual existence is confirmed again before writing.
  try { return statSync(siteFile(`guides/${item.slug}/index.html`)).isFile(); }
  catch { return false; }
}

async function setOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''));
}

function validateHtml(content, item, canonical) {
  if (!content.includes('<!doctype html>') || !content.includes('<article>') || !content.includes('<h1>')) {
    throw new Error('Guide HTML is incomplete.');
  }
  if (!content.includes(`<link rel="canonical" href="${canonical}">`)) throw new Error('Guide canonical URL is missing.');
  if (!content.includes('name="description"')) throw new Error('Guide meta description is missing.');
  if (!content.includes('application/ld+json')) throw new Error('Guide Article schema is missing.');
  if (!content.includes(item.slug) || /\[TODO\]|PLACEHOLDER|example\.com/i.test(content)) throw new Error('Guide contains a placeholder or wrong slug.');
  const sourceHosts = [...content.matchAll(/href="(https:\/\/[^"#]+)"/g)]
    .map((match) => sourceOrganization(new URL(match[1]).hostname))
    .filter(Boolean);
  if (new Set(sourceHosts).size < 2) throw new Error('Guide needs links to at least two authoritative source domains.');
}

async function validateLocalLinks(file) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(/(?:href|src)="([^"']+)"/g)) {
    const raw = match[1];
    if (/^(?:https?:|mailto:|data:|#)/.test(raw)) continue;
    const localPath = decodeURIComponent(raw.split(/[?#]/)[0]);
    const target = path.resolve(path.dirname(file), localPath);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error(`Link escapes site root: ${raw}`);
    const candidate = target.endsWith(path.sep) || !path.extname(target) ? path.join(target, 'index.html') : target;
    if (!await exists(candidate)) throw new Error(`Missing local link or asset: ${raw} in ${file}`);
  }
}

function sourceOrganization(host) {
  return [
    'healthychildren.org', 'cdc.gov', 'nhs.uk', 'who.int', 'unicef.org',
    'nih.gov', 'developingchild.harvard.edu', 'zerotothree.org',
  ].find((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}
