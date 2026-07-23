/**
 * Utility for exporting data to CSV.
 * Designed to work in the browser (Client Components).
 */

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) {
    return;
  }

  // Extract headers
  const headers = Object.keys(rows[0]);
  
  // Format CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(fieldName => {
        let field = row[fieldName];
        // Handle null/undefined
        if (field === null || field === undefined) {
          field = '';
        }
        // Handle dates
        else if (field instanceof Date) {
          field = field.toISOString();
        }
        // Handle objects
        else if (typeof field === 'object') {
          field = JSON.stringify(field);
        }
        
        // Escape quotes and commas
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    )
  ].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
