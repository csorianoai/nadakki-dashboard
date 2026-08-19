// P1: Verificar endpoint de mensajes no leídos para DEALER
const BACKEND = 'https://api.nadakki.com';

// Login como dealer
const loginRes = await fetch(`${BACKEND}/api/v2/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'dealer.qa@test-piloto-02.com',
    password: 'DealerQA2026!Seguro',
  }),
});

const loginData = await loginRes.json();
const dealerToken = loginData.token || loginData.access_token;
console.log('✓ Dealer login exitoso\n');

// Buscar una aplicación del dealer para probar
const appsRes = await fetch(`${BACKEND}/api/v2/credit/applications?limit=5`, {
  headers: { 'Authorization': `Bearer ${dealerToken}` },
});

const appsData = await appsRes.json();
const testAppId = appsData.applications?.[0]?.application_id || 'edd8bc26-9c00-4467-9cfa-737698dfa47e';
console.log(`Usando aplicación: ${testAppId}\n`);

// Test 1: Endpoint con reader_type=DEALER
console.log('=== TEST 1: Endpoint con reader_type=DEALER ===');
const dealerUnreadRes = await fetch(
  `${BACKEND}/api/v2/credit/applications/${testAppId}/messages/unread-count?reader_type=DEALER`,
  { headers: { 'Authorization': `Bearer ${dealerToken}` } }
);
console.log(`Status: ${dealerUnreadRes.status}`);
if (dealerUnreadRes.ok) {
  const data = await dealerUnreadRes.json();
  console.log('✅ ENDPOINT EXISTE');
  console.log('Respuesta:', JSON.stringify(data, null, 2));
} else {
  const errorText = await dealerUnreadRes.text();
  console.log('❌ ENDPOINT NO EXISTE O ERROR');
  console.log('Error:', errorText);
}

// Test 2: Endpoint sin reader_type (ver qué pasa)
console.log('\n=== TEST 2: Endpoint sin reader_type ===');
const noTypeRes = await fetch(
  `${BACKEND}/api/v2/credit/applications/${testAppId}/messages/unread-count`,
  { headers: { 'Authorization': `Bearer ${dealerToken}` } }
);
console.log(`Status: ${noTypeRes.status}`);
if (noTypeRes.ok) {
  const data = await noTypeRes.json();
  console.log('Respuesta:', JSON.stringify(data, null, 2));
} else {
  console.log('Error:', await noTypeRes.text());
}

// Test 3: Listar mensajes para ver estructura
console.log('\n=== TEST 3: Estructura de mensajes ===');
const messagesRes = await fetch(
  `${BACKEND}/api/v2/credit/applications/${testAppId}/messages`,
  { headers: { 'Authorization': `Bearer ${dealerToken}` } }
);
if (messagesRes.ok) {
  const messages = await messagesRes.json();
  console.log(`Total mensajes: ${messages.messages?.length || 0}`);
  if (messages.messages?.[0]) {
    console.log('Estructura primer mensaje:', JSON.stringify(messages.messages[0], null, 2));
  }
} else {
  console.log('Error obteniendo mensajes:', await messagesRes.text());
}
