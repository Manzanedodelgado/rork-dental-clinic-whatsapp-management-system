// Google Sheets Configuration
export const GOOGLE_CONFIG = {
  // Google Sheets configuración
  GOOGLE_SHEET_ID: '1MBDBHQ08XGuf5LxVHCFhHDagIazFkpBnxwqyEQIBJrQ',  // Tu Google Sheet existente
  GOOGLE_API_KEY: 'AIzaSyA0c7nuWYhCyuiT8F2dBI_v-oqyjoutQ4A',  // Tu API key actual
  SHEET_NAME: 'Hoja 1',
  
  // Service Account (si decides usarlo en el futuro)
  SERVICE_ACCOUNT_FILE: 'service-account-key.json',  // Archivo JSON de Service Account
};

// URLs para acceso a Google Sheets
export const GOOGLE_SHEETS_URLS = {
  // API v4 URL
  getApiUrl: (sheetId: string, sheetName: string, apiKey: string) => 
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`,
  
  // CSV Export URL
  getCsvUrl: (sheetId: string) => 
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
  
  // Test connection URL
  getTestUrl: (sheetId: string, apiKey: string) => 
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}&fields=sheets.properties.title`,
};

// Debug configuration
console.log('🔧 Google Sheets Configuration loaded:');
console.log('   📊 Sheet ID:', GOOGLE_CONFIG.GOOGLE_SHEET_ID);
console.log('   🔑 API Key:', GOOGLE_CONFIG.GOOGLE_API_KEY ? `${GOOGLE_CONFIG.GOOGLE_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('   📋 Sheet Name:', GOOGLE_CONFIG.SHEET_NAME);