import { TransportDatabase } from './types';
import { INITIAL_DATABASE } from './initialData';

// Helper to format currency
export function formatCurrency(amount: number, symbol: string, decimalPlaces?: number): string {
  let dec = decimalPlaces;
  if (dec === undefined) {
    try {
      const saved = localStorage.getItem('transport_business_db_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.settings?.decimalPlaces !== undefined) {
          dec = Number(parsed.settings.decimalPlaces);
        }
      }
    } catch (e) {
      // ignore
    }
  }
  if (dec === undefined) {
    dec = 2;
  }
  return `${symbol}${amount.toLocaleString('en-IN', {
    maximumFractionDigits: dec,
    minimumFractionDigits: dec
  })}`;
}

// Helper to format date nicely
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Calculate fuel entries dynamically
export interface FuelCalcResult {
  distanceTravelled: number;
  totalCost: number;
  mileage: number;
  costPerKm: number;
}

export function calculateFuel(
  odometer: number,
  prevOdometer: number,
  liters: number,
  rate: number
): FuelCalcResult {
  const distance = Math.max(0, odometer - prevOdometer);
  const totalCost = liters * rate;
  const mileage = liters > 0 ? Number((distance / liters).toFixed(2)) : 0;
  const costPerKm = distance > 0 ? Number((totalCost / distance).toFixed(2)) : 0;

  return {
    distanceTravelled: distance,
    totalCost: Number(totalCost.toFixed(2)),
    mileage,
    costPerKm
  };
}

// Export array of objects to CSV/Excel format
export function downloadCSV(
  data: any[],
  filename: string,
  headers: string[],
  rowMapper: (item: any) => string[]
) {
  // Add UTF-8 BOM so Excel opens it with correct encoding
  const bom = '\ufeff';
  
  const csvContent = data.map(item => {
    const row = rowMapper(item);
    return row.map(val => {
      // Escape double quotes and wrap in quotes if there are commas/newlines
      const stringVal = val === null || val === undefined ? '' : String(val);
      const cleanVal = stringVal.replace(/"/g, '""');
      if (cleanVal.includes(',') || cleanVal.includes('\n') || cleanVal.includes('"')) {
        return `"${cleanVal}"`;
      }
      return cleanVal;
    }).join(',');
  });

  const fullContent = bom + [headers.join(','), ...csvContent].join('\n');
  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export array of objects to styled Excel spreadsheet
export function downloadExcel(
  data: any[],
  filename: string,
  headers: string[],
  rowMapper: (item: any) => string[],
  sheetName: string = 'Report'
) {
  // To ensure 100% compatibility with MS Excel with proper layout and formatting,
  // we export as a standard XML/HTML Spreadsheet format with a .xls extension,
  // which MS Excel opens instantly as a native spreadsheet.
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetName}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    </head>
    <body>
      <table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 11px;">
        <thead>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            \${headers.map(h => \`<th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">\${h}</th>\`).join('')}
          </tr>
        </thead>
        <tbody>
          \${data.map(item => \`
            <tr>
              \${rowMapper(item).map(val => \`<td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left; mso-number-format:'\\\\@';">\${val === null || val === undefined ? '' : String(val).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>\`).join('')}
            </tr>
          \`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `\${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export high-fidelity standalone HTML report that auto-triggers print to Save as PDF
export function downloadPrintableReport(
  data: any[],
  filename: string,
  headers: string[],
  rowMapper: (item: any) => string[],
  title: string,
  companyName: string,
  currencySymbol: string,
  summaryMetrics?: { label: string; value: string }[]
) {
  const tableHeaders = headers.map(h => `<th style="background-color: #f1f5f9; color: #1e293b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding: 12px 10px; text-align: left; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${h}</th>`).join('');
  
  const tableRows = data.map((item, index) => {
    const cells = rowMapper(item);
    const borderBottom = index === data.length - 1 ? '' : 'border-bottom: 1px solid #e2e8f0;';
    return `<tr style="${borderBottom}">` + 
      cells.map(c => `<td style="padding: 10px 10px; font-family: sans-serif; font-size: 11px; color: #334155; text-align: left; vertical-align: top; line-height: 1.4;">${c === null || c === undefined ? '' : String(c).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('') + 
      '</tr>';
  }).join('');

  let metricsHtml = '';
  if (summaryMetrics && summaryMetrics.length > 0) {
    metricsHtml = `
      <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
        ${summaryMetrics.map(m => `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 18px; flex: 1; min-width: 140px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02);">
            <div style="font-family: sans-serif; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">${m.label}</div>
            <div style="font-family: sans-serif; font-size: 18px; color: #0f172a; font-weight: 700; margin-top: 4px;">${m.value}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 30px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          background-color: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .company-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .report-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 5px 0 0 0;
          font-weight: 500;
        }
        .metadata {
          text-align: right;
          font-size: 11px;
          color: #64748b;
        }
        .metadata p {
          margin: 2px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        @media print {
          body {
            padding: 15px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02);">
        <div style="flex: 1; margin-right: 15px;">
          <h4 style="margin: 0 0 3px 0; font-size: 13px; color: #166534; font-family: sans-serif; font-weight: 700;">Print / Save as PDF Statement</h4>
          <p style="margin: 0; font-size: 11px; color: #15803d; font-family: sans-serif;">Your local web browser's print engine has been launched automatically. To keep a local PDF copy of this statement, configure your destination to <strong>"Save as PDF"</strong> or <strong>"Microsoft Print to PDF"</strong>.</p>
        </div>
        <button onclick="window.print()" style="background-color: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-family: sans-serif; font-size: 12px; cursor: pointer; transition: background-color 0.15s ease;">Print / Save</button>
      </div>

      <div class="header">
        <div>
          <h1 class="company-title">${companyName}</h1>
          <p class="report-subtitle">${title}</p>
        </div>
        <div class="metadata">
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>System:</strong> Secure Offline Ledger</p>
        </div>
      </div>

      ${metricsHtml}

      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 600);
        };
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Backup database to JSON
export function backupDatabase(db: TransportDatabase) {
  const dataStr = JSON.stringify(db, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `transport_backup_${dateStr}.json`;
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Restore database from JSON file
export function restoreDatabase(file: File): Promise<TransportDatabase> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        if (parsed && typeof parsed === 'object') {
          // Initialize missing collections gracefully to maintain 100% backward/forward resilience
          const healedDb: TransportDatabase = {
            vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
            drivers: Array.isArray(parsed.drivers) ? parsed.drivers : [],
            income: Array.isArray(parsed.income) ? parsed.income : [],
            expenses: Array.isArray(parsed.expenses) ? parsed.expenses : (Array.isArray(parsed.expense) ? parsed.expense : []),
            fuelRecords: Array.isArray(parsed.fuelRecords) ? parsed.fuelRecords : (Array.isArray(parsed.fuel) ? parsed.fuel : []),
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            settings: {
              ...INITIAL_DATABASE.settings,
              ...(parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {})
            },
            trashBin: Array.isArray(parsed.trashBin) ? parsed.trashBin : []
          };
          
          resolve(healedDb);
        } else {
          reject(new Error('Invalid backup file structure. File must contain a database object.'));
        }
      } catch (e) {
        reject(new Error('Failed to parse file. Ensure it is a valid JSON backup.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading backup file.'));
    reader.readAsText(file);
  });
}
