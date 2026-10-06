/**
 * Export checklist to CSV.
 */
export function exportChecklistCsv(tender, requirementStatuses, lang = 'en') {
  const headers = [
    'Order',
    'Document ID',
    'Document Title',
    'Type',
    'Matched File',
    'Page Count',
    'Expiry Date',
    'Status',
  ];

  const rows = requirementStatuses.map(item => {
    const title = lang === 'bn' ? (item.requirement.title_bn || item.requirement.title_en) : item.requirement.title_en;
    const type = item.requirement.mandatory ? 'Mandatory' : 'Optional';
    const fileName = item.matchedFile ? item.matchedFile.name : 'N/A';
    const pages = item.matchedFile ? (item.matchedFile.pageCount || 1) : 0;
    const expiry = item.expiryDate || 'N/A';
    const status = item.status;

    return [
      item.requirement.order,
      item.requirement.id,
      `"${title.replace(/"/g, '""')}"`,
      type,
      `"${fileName.replace(/"/g, '""')}"`,
      pages,
      expiry,
      status,
    ].join(',');
  });

  const csvContent = [
    `# Tender Checklist: ${tender.tender_id} - ${tender.title}`,
    `# Submission Deadline: ${tender.submission_deadline}`,
    headers.join(','),
    ...rows,
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${tender.tender_id}_Checklist.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
