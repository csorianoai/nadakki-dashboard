// Check Vercel deployment status
import https from 'https';

const options = {
  hostname: 'dashboard.nadakki.com',
  port: 443,
  path: '/',
  method: 'HEAD',
};

console.log('Checking Vercel deployment status...\n');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Server: ${res.headers['server']}`);
  console.log(`Date: ${res.headers['date']}`);
  console.log(`X-Vercel-ID: ${res.headers['x-vercel-id']}`);
  console.log(`X-Vercel-Cache: ${res.headers['x-vercel-cache']}`);
  
  // Fetch the actual page to check for deployment ID
  const getOptions = { ...options, method: 'GET' };
  const getReq = https.request(getOptions, (getRes) => {
    let data = '';
    getRes.on('data', (chunk) => { data += chunk; });
    getRes.on('end', () => {
      const match = data.match(/<meta name="deployment-id" content="([^"]+)"/);
      if (match) {
        console.log(`Deployment ID: ${match[1]}`);
      }
      // Check git commit in meta tag
      const commitMatch = data.match(/<meta name="git-commit" content="([^"]+)"/);
      if (commitMatch) {
        console.log(`Git Commit: ${commitMatch[1]}`);
        console.log(`Expected: 8d2c0cb9`);
        console.log(commitMatch[1].startsWith('8d2c0cb9') ? '✅ Vercel has deployed latest commit' : '❌ Vercel still serving old commit');
      }
    });
  });
  getReq.end();
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.end();
