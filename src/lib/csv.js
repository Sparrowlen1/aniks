/* CSV export helper — client-side, no dependencies */

function escapeCell(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCSV(rows, headers) {
  const head = headers.map((h) => escapeCell(h.label)).join(',');
  const body = rows.map((row) =>
    headers.map((h) => escapeCell(h.get ? h.get(row) : row[h.key])).join(','),
  );
  return [head, ...body].join('\n');
}

export function downloadCSV(filename, csv) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
