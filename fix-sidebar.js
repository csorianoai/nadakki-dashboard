const fs = require("fs");
let c = fs.readFileSync("components/layout/DashboardLayout.tsx", "utf8");

// Only add if not already present
if (!c.includes("agents-execute")) {
  c = c.replace(
    /(\{ id: "settings"[^\n]+\n)/,
    '$1      { id: "agents-execute", icon: "\u25B6\uFE0F", label: "Ejecutar Agentes", href: "/agents/execute", badge: "42" },\n'
  );
}

if (!c.includes("mkt-google-ads")) {
  c = c.replace(
    /(\{ id: "mkt-social"[^\n]+\n)/,
    '$1      { id: "mkt-google-ads", icon: "\uD83D\uDD0E", label: "Google Ads", href: "/marketing/google-ads" },\n      { id: "mkt-attribution", icon: "\uD83D\uDD17", label: "Attribution", href: "/marketing/attribution" },\n      { id: "mkt-ab-testing", icon: "\uD83E\uDDEA", label: "A/B Testing", href: "/marketing/ab-testing" },\n'
  );
}

if (!c.includes("admin-compliance")) {
  c = c.replace(
    /(\{ id: "admin-logs"[^\n]+\n)/,
    '$1      { id: "admin-compliance", icon: "\uD83D\uDEE1\uFE0F", label: "Compliance", href: "/compliance" },\n      { id: "admin-testing", icon: "\uD83E\uDDEA", label: "Testing Lab", href: "/testing" },\n'
  );
}

c = c.replace('badge: "35"', 'badge: "42"');

fs.writeFileSync("components/layout/DashboardLayout.tsx", c, "utf8");
console.log("Sidebar updated OK - no duplicates");
