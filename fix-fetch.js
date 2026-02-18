const fs = require("fs");
let c = fs.readFileSync("app/agents/execute/page.tsx", "utf8");
// Fix: fetch`...`) => fetch(`...`)
c = c.replace(/fetch`(\$\{apiUrl\}\/health`)\)/g, 'fetch(`${apiUrl}/health`)');
c = c.replace(/fetch`(\$\{apiUrl\}\/api\/catalog\?module=marketing&limit=300`)\)/g, 'fetch(`${apiUrl}/api/catalog?module=marketing&limit=300`)');
fs.writeFileSync("app/agents/execute/page.tsx", c, "utf8");
console.log("Fixed fetch calls");
