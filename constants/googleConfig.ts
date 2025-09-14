// Google Sheets Configuration
export const GOOGLE_CONFIG = {
  GOOGLE_SHEET_ID: '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ',
  GOOGLE_API_KEY: '',
  // Asegúrate que el nombre coincide exactamente con la pestaña de tu hoja
  SHEET_NAME: 'Hoja 1',
  SERVICE_ACCOUNT_FILE: 'service-account-key.json',
};

// URLs para acceso a Google Sheets (solo endpoints públicos, sin OAuth)
export const GOOGLE_SHEETS_URLS = {
  // CSV vía GViz usando el nombre de hoja (funciona en hojas públicas sin OAuth)
  getGvizCsvUrl: (sheetId: string, sheetName: string) =>
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`,

  // CSV export por gid (fallback cuando conocemos gid o es la primera hoja)
  getExportCsvUrl: (sheetId: string, gid = '0') =>
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,

  // GViz JSON (otro fallback público)
  getGvizJsonUrl: (sheetId: string, sheetName: string) =>
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=out:json`,
};

console.log('🔧 Google Sheets Configuration loaded:');
console.log('   📊 Sheet ID:', GOOGLE_CONFIG.GOOGLE_SHEET_ID);
console.log('   📋 Sheet Name:', GOOGLE_CONFIG.SHEET_NAME);