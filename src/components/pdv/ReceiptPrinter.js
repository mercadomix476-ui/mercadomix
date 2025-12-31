
export const printReceipt = (sale, settings) => {
  const width = settings?.printer_width || 58; // 58mm or 80mm
  
  const content = `
    <html>
      <head>
        <title>Recibo #${sale.sale_number}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: ${width}mm;
            margin: 0;
            padding: 5px;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .store-name { font-weight: bold; font-size: 14px; }
          .info { font-size: 10px; margin-bottom: 5px; }
          .items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .items th { text-align: left; border-bottom: 1px solid #000; font-size: 10px; }
          .items td { padding: 2px 0; font-size: 10px; }
          .total-section { border-top: 1px dashed #000; padding-top: 5px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { margin-top: 15px; text-align: center; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${settings?.store_name || "Nexus Commerce"}</div>
          <div class="info">
            ${settings?.address || ""}<br>
            ${settings?.phone || ""}<br>
            ${settings?.cnpj ? `CNPJ: ${settings.cnpj}` : ""}
          </div>
          <div class="info">
            Data: ${new Date(sale.created_date).toLocaleString('pt-BR')}<br>
            Venda: #${sale.sale_number}
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th style="width: 50%">Item</th>
              <th style="width: 15%">Qtd</th>
              <th style="width: 35%; text-align: right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}x</td>
                <td style="text-align: right">R$ ${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>R$ ${sale.subtotal.toFixed(2)}</span>
          </div>
          ${sale.discount > 0 ? `
            <div class="total-row">
              <span>Desconto:</span>
              <span>- R$ ${sale.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row total">
            <span>TOTAL:</span>
            <span>R$ ${sale.total.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Pagamento (${sale.payment_method}):</span>
            <span>R$ ${sale.amount_paid.toFixed(2)}</span>
          </div>
          ${sale.change > 0 ? `
            <div class="total-row">
              <span>Troco:</span>
              <span>R$ ${sale.change.toFixed(2)}</span>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Obrigado pela preferência!</p>
          <p>Volte sempre.</p>
        </div>
        <script>
            window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
  } else {
    alert("Pop-up bloqueado. Permita pop-ups para imprimir.");
  }
};

export const printReceiptBrowser = (sale, settings) => {
    printReceipt(sale, settings);
};
