import type { Campaign } from './data';

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsJson(data: Campaign[], filename = 'campaign_data.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadFile(blob, filename);
}

export function exportAsCsv(data: Campaign[], filename = 'campaign_data.csv') {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(fieldName => JSON.stringify(row[fieldName as keyof Campaign], (key, value) => value === null ? '' : value)).join(',')
    )
  ];

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
}

function toXml(data: Campaign[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<campaigns>\n';
  data.forEach(campaign => {
    xml += '  <campaign>\n';
    for (const key in campaign) {
      if (Object.prototype.hasOwnProperty.call(campaign, key)) {
        xml += `    <${key}>${campaign[key as keyof Campaign]}</${key}>\n`;
      }
    }
    xml += '  </campaign>\n';
  });
  xml += '</campaigns>';
  return xml;
}

export function exportAsXml(data: Campaign[], filename = 'campaign_data.xml') {
  const xmlString = toXml(data);
  const blob = new Blob([xmlString], { type: 'application/xml' });
  downloadFile(blob, filename);
}
