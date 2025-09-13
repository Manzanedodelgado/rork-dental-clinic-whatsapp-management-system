// Test Google Sheets Configuration (public access only, no API key)
import { GOOGLE_CONFIG, GOOGLE_SHEETS_URLS } from '@/constants/googleConfig';
import { GoogleSheetsService } from '@/services/googleSheetsService';

export class GoogleSheetsTestService {
  static async runDiagnostics(): Promise<void> {
    console.log('🔧 === GOOGLE SHEETS DIAGNOSTICS ===');
    
    // 1. Configuration Check
    console.log('\n📋 1. Configuration Check:');
    console.log('   Sheet ID:', GOOGLE_CONFIG.GOOGLE_SHEET_ID);
    console.log('   Sheet Name:', GOOGLE_CONFIG.SHEET_NAME);
    
    // 2. URL Generation Test
    console.log('\n🌐 2. URL Generation Test:');
    const csvUrl = GOOGLE_SHEETS_URLS.getGvizCsvUrl(GOOGLE_CONFIG.GOOGLE_SHEET_ID, GOOGLE_CONFIG.SHEET_NAME);
    const csvExportUrl = GOOGLE_SHEETS_URLS.getExportCsvUrl(GOOGLE_CONFIG.GOOGLE_SHEET_ID);
    const gvizJsonUrl = GOOGLE_SHEETS_URLS.getGvizJsonUrl(GOOGLE_CONFIG.GOOGLE_SHEET_ID, GOOGLE_CONFIG.SHEET_NAME);
    
    console.log('   GViz CSV URL:', csvUrl);
    console.log('   Export CSV URL:', csvExportUrl);
    console.log('   GViz JSON URL:', gvizJsonUrl);
    
    // 3. Connection Test
    console.log('\n🔍 3. Connection Test (CSV):');
    const connectionResult = await GoogleSheetsService.testConnection();
    console.log('   Connection Status:', connectionResult ? '✅ SUCCESS' : '❌ FAILED');
    
    // 4. Data Fetch Test
    console.log('\n📊 4. Data Fetch Test:');
    try {
      const { appointments, patients } = await GoogleSheetsService.fetchAppointments();
      console.log('   Appointments fetched:', appointments.length);
      console.log('   Patients extracted:', patients.length);
      
      if (appointments.length > 0) {
        console.log('   Sample appointment:', {
          id: appointments[0].id,
          patient: appointments[0].patientName,
          date: appointments[0].date,
          time: appointments[0].time,
          treatment: appointments[0].treatment
        });
      }
      
      console.log('✅ Data fetch test completed successfully');
    } catch (error) {
      console.error('❌ Data fetch test failed:', error);
    }
    
    console.log('\n🔧 === DIAGNOSTICS COMPLETE ===');
  }
  
  static async quickTest(): Promise<boolean> {
    try {
      console.log('⚡ Running quick Google Sheets test...');
      
      // Test connection
      const connected = await GoogleSheetsService.testConnection();
      if (!connected) {
        console.log('❌ Quick test failed: Connection issue');
        return false;
      }
      
      // Test data fetch
      const { appointments } = await GoogleSheetsService.fetchAppointments();
      console.log(`✅ Quick test passed: ${appointments.length} appointments available`);
      return true;
      
    } catch (error) {
      console.error('❌ Quick test failed:', error);
      return false;
    }
  }
}

// Auto-run diagnostics in development
if (__DEV__) {
  console.log('🚀 Auto-running Google Sheets diagnostics...');
  GoogleSheetsTestService.runDiagnostics().catch(console.error);
}