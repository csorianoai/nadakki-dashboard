/**
 * Direct backend verification script
 * Fetches stipulations and audit data from production backend
 */

const APPLICATION_ID = '6a68b243-567b-493d-9b7d-68fd048eb62d';
const TENANT_ID = '5400c834-24bd-4662-8d77-915ccebdb73a';
const BACKEND_URL = 'https://api.nadakki.com';

// Token from user (analista@test-piloto-02.com)
// This will need to be updated with a fresh token
const TOKEN = process.env.BANK_TOKEN || '';

async function checkEndpoint(name, path) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`CHECKING: ${name}`);
  console.log(`URL: ${BACKEND_URL}${path}`);
  console.log('='.repeat(80));
  
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-Tenant-ID': TENANT_ID,
        'X-Actor-Role': 'bank_analyst',
        'Accept': 'application/json',
      },
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`Error body: ${text}`);
      return;
    }
    
    const data = await response.json();
    console.log(`Body type: ${Array.isArray(data) ? 'array' : typeof data}`);
    console.log(`Body:`);
    console.log(JSON.stringify(data, null, 2));
    
    // Specific checks
    if (name.includes('stipulations')) {
      console.log(`\nSTIPULATIONS ANALYSIS:`);
      console.log(`- has 'stipulations' key: ${Boolean(data.stipulations)}`);
      console.log(`- stipulations is array: ${Array.isArray(data.stipulations)}`);
      console.log(`- stipulations length: ${data.stipulations?.length ?? 'N/A'}`);
      console.log(`- has 'summary' key: ${Boolean(data.summary)}`);
    }
    
    if (name.includes('audit')) {
      console.log(`\nAUDIT ANALYSIS:`);
      console.log(`- has 'events' key: ${Boolean(data.events)}`);
      console.log(`- events is array: ${Array.isArray(data.events)}`);
      console.log(`- events length: ${data.events?.length ?? 'N/A'}`);
      console.log(`- has 'has_analysis' key: ${Boolean('has_analysis' in data)}`);
      console.log(`- has 'has_bank_decision' key: ${Boolean('has_bank_decision' in data)}`);
      
      if (Array.isArray(data.events) && data.events.length > 0) {
        console.log(`\nFIRST EVENT:`);
        console.log(JSON.stringify(data.events[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error(`Fetch error: ${error.message}`);
  }
}

async function main() {
  if (!TOKEN) {
    console.error('ERROR: BANK_TOKEN environment variable not set');
    console.error('Usage: $env:BANK_TOKEN="<token>"; node scripts/verify-backend-direct.mjs');
    process.exit(1);
  }
  
  await checkEndpoint(
    'Stipulations',
    `/api/v2/credit/applications/${APPLICATION_ID}/stipulations`
  );
  
  await checkEndpoint(
    'Audit Trail',
    `/api/v2/credit/applications/${APPLICATION_ID}/audit-trail`
  );
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(80));
}

main().catch(console.error);
