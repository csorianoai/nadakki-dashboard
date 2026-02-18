const fs = require("fs");
let lines = fs.readFileSync("app/agents/execute/page.tsx", "utf8").split("\n");
lines[204] = '    fetch(`${apiUrl}/health`)';
lines[211] = '    fetch(`${apiUrl}/api/catalog?module=marketing&limit=300`)';
fs.writeFileSync("app/agents/execute/page.tsx", lines.join("\n"), "utf8");
console.log("Lines 205 and 212 fixed");
