/**
 * Utility for generating PDF Invoices.
 * For MVP/Prototype, this opens a clean HTML view optimized for the browser's native "Print to PDF" dialog.
 * In a production environment, this could be replaced with `jspdf` or `puppeteer` on the server.
 */

export const generateInvoicePDF = (invoiceData: any, tenantConfig: any) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.error("Failed to open print window. Popup blocker might be enabled.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .logo { max-height: 60px; }
        .title { font-size: 28px; font-weight: bold; color: ${tenantConfig.colors?.primary || '#2563eb'}; }
        .details { margin-bottom: 30px; display: flex; justify-content: space-between; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background: #f8fafc; font-weight: 600; }
        .total { text-align: right; font-size: 20px; font-weight: bold; }
        @media print {
          body { -webkit-print-color-adjust: exact; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${tenantConfig.logoUrl ? `<img src="${tenantConfig.logoUrl}" class="logo" />` : `<h2 style="margin:0">${tenantConfig.brandTitle || 'EMS'}</h2>`}
        <div>
          <div class="title">INVOICE</div>
          <div>#${invoiceData.invoiceNumber}</div>
          <div>Date: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      
      <div class="details">
        <div>
          <strong>Bill To:</strong><br>
          ${invoiceData.ticket.customer?.companyName || invoiceData.ticket.customer?.contactName || 'Valued Customer'}<br>
          ${invoiceData.ticket.customer?.address || ''}
        </div>
        <div style="text-align: right;">
          <strong>Status:</strong> ${invoiceData.status}
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Service: ${invoiceData.ticket.itemDescription || 'General Service'}</td>
            <td style="text-align: right">$${invoiceData.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="total">
        Total Due: $${invoiceData.totalAmount.toFixed(2)}
      </div>

      <script>
        window.onload = () => {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
