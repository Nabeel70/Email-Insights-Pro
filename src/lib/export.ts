import type { DailyReport } from './types';

type Exportable = DailyReport[] | any[]; // Make it more generic

function downloadFile(blob: Blob, filename:string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsJson(data: Exportable, filename = 'data.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadFile(blob, filename);
}

export function exportAsCsv(data: Exportable, filename = 'data.csv') {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(fieldName => JSON.stringify(row[fieldName as keyof any], (key, value) => value === null ? '' : value)).join(',')
    )
  ];

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
}

function toXml(data: Exportable): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<reports>\n';
  data.forEach(item => {
    xml += '  <report>\n';
    for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        xml += `    <${key}>${item[key as keyof any]}</${key}>\n`;
      }
    }
    xml += '  </report>\n';
  });
  xml += '</reports>';
  return xml;
}

export function exportAsXml(data: Exportable, filename = 'data.xml') {
  const xmlString = toXml(data);
  const blob = new Blob([xmlString], { type: 'application/xml' });
  downloadFile(blob, filename);
}
