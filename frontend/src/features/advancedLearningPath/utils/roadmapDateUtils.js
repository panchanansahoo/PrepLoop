export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function mondayISO(dateObj = new Date()) {
  const date = new Date(dateObj);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

export function daysBetweenISO(aISO, bISO) {
  const a = new Date(aISO + 'T00:00:00Z');
  const b = new Date(bISO + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

export function formatDateISO(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

export function formatDisplayDate(isoDate) {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function nextDateISO(dateISO) {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return formatDateISO(d);
}

export function compactDate(iso) {
  return iso.replace(/-/g, '');
}

export function datesBetween(startDate, daysCount) {
  const out = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    out.push(d);
  }
  return out;
}
