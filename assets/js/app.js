const $ = (selector) => document.querySelector(selector);
const form = $('#trial-form');
const result = $('#result');
let current = null;

const todayISO = () => new Date().toISOString().slice(0, 10);
const parseDate = (value) => new Date(`${value}T12:00:00`);
const isoDate = (date) => date.toISOString().slice(0, 10);
const addMonths = (date, months) => { const copy = new Date(date); copy.setMonth(copy.getMonth() + months); return copy; };
const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };
// The site is English-first, so dates stay in an unambiguous English format
// regardless of the visitor's browser language or regional settings.
const formatDate = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);

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

document.querySelectorAll('[data-tool]').forEach((toolForm) => {
  const dateField = toolForm.elements.start;
  if (dateField) dateField.value = todayISO();

  toolForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(toolForm));
    const output = toolForm.parentElement.querySelector('.result');
    const outputTitle = output.querySelector('h3');
    const outputText = output.querySelector('p:not(.eyebrow)');
    const service = data.service?.trim() || 'This subscription';

    if (toolForm.dataset.tool === 'renewal') {
      const start = parseDate(data.start);
      const amount = Number(data.amount);
      const next = data.unit === 'months'
        ? addMonths(start, amount)
        : addDays(start, amount * (data.unit === 'weeks' ? 7 : 1));
      outputTitle.textContent = formatDate(next);
      outputText.textContent = `${service} is expected to renew on this date based on the billing interval you entered.`;
    }

    if (toolForm.dataset.tool === 'refund') {
      const policyEnd = addDays(parseDate(data.start), Number(data.window));
      const safeDate = addDays(policyEnd, -Number(data.buffer));
      outputTitle.textContent = formatDate(safeDate);
      outputText.textContent = `${service}'s stated window is expected to end on ${formatDate(policyEnd)}. Confirm the seller's policy before acting.`;
    }

    if (toolForm.dataset.tool === 'annual') {
      const monthlyYear = Number(data.monthly) * 12;
      const annual = Number(data.annual);
      const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency, maximumFractionDigits: data.currency === 'KRW' ? 0 : 2 });
      const difference = monthlyYear - annual;
      outputTitle.textContent = difference > 0
        ? `Save ${formatter.format(difference)} per year`
        : difference < 0
          ? `Monthly costs ${formatter.format(-difference)} less`
          : 'The yearly cost is the same';
      outputText.textContent = `${service}: monthly billing costs ${formatter.format(monthlyYear)} per year; the annual plan costs ${formatter.format(annual)}.`;
    }

    output.hidden = false;
    output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});
