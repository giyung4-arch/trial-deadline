const $ = (selector) => document.querySelector(selector);
const form = $('#trial-form');
const result = $('#result');
let current = null;

const todayISO = () => new Date().toISOString().slice(0, 10);
const parseDate = (value) => new Date(`${value}T12:00:00`);
const isoDate = (date) => date.toISOString().slice(0, 10);
const addMonths = (date, months) => { const copy = new Date(date); copy.setMonth(copy.getMonth() + months); return copy; };
const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };
const formatDate = (date) => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);

function calculate(data) {
  const start = parseDate(data.start);
  const duration = Number(data.duration);
  const totalDays = data.unit === 'weeks' ? duration * 7 : duration;
  const end = data.unit === 'months' ? addMonths(start, duration) : addDays(start, totalDays);
  const deadline = addDays(end, -Number(data.buffer));
  return { ...data, end: isoDate(end), deadline: isoDate(deadline) };
}
function render(data) {
  current = calculate(data);
  const deadline = parseDate(current.deadline);
  $('#deadline-date').textContent = formatDate(deadline);
  const service = current.service.trim() || 'your subscription';
  $('#deadline-message').textContent = `Set aside time to cancel ${service} by this date. The trial is expected to end on ${formatDate(parseDate(current.end))}.`;
  result.hidden = false;
  history.replaceState(null, '', `?${new URLSearchParams({ s: current.service, d: current.start, l: current.duration, u: current.unit, b: current.buffer })}`);
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function downloadCalendar() {
  if (!current) return;
  const title = `Cancel ${current.service.trim() || 'free trial'}`;
  const date = current.deadline.replaceAll('-', '');
  const nextDate = isoDate(addDays(parseDate(current.deadline), 1)).replaceAll('-', '');
  const content = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Trial Deadline//EN','BEGIN:VEVENT',`UID:${Date.now()}@trialdeadline`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,`DTSTART;VALUE=DATE:${date}`,`DTEND;VALUE=DATE:${nextDate}`,`SUMMARY:${title.replace(/[\\,;]/g, '\\$&')}`,`DESCRIPTION:Suggested cancellation deadline. Confirm the provider\\'s terms before acting.`, 'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([content], { type: 'text/calendar' })), download: 'trial-cancellation-deadline.ics' });
  link.click(); URL.revokeObjectURL(link.href);
}
async function copyLink() {
  try { await navigator.clipboard.writeText(location.href); $('#copy-status').textContent = 'Share link copied.'; }
  catch { $('#copy-status').textContent = 'Copy the link from your browser’s address bar.'; }
}
function restoreFromURL() {
  const p = new URLSearchParams(location.search);
  if (!p.has('d')) return;
  const data = { service: p.get('s') || '', start: p.get('d'), duration: p.get('l') || '30', unit: p.get('u') || 'days', buffer: p.get('b') || '2' };
  Object.entries(data).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; }); render(data);
}
$('#year').textContent = new Date().getFullYear();

if (form) {
  $('#start-date').value = todayISO();
  form.addEventListener('submit', (event) => { event.preventDefault(); render(Object.fromEntries(new FormData(form))); });
  $('#calendar-button').addEventListener('click', downloadCalendar);
  $('#share-button').addEventListener('click', copyLink);
  restoreFromURL();
}
