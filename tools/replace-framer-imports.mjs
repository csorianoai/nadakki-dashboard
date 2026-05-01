import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name.name)) out.push(p);
  }
  return out;
}

const dirs = [path.join(root, "app"), path.join(root, "components")];
let n = 0;
for (const d of dirs) {
  for (const file of walk(d)) {
    let s = fs.readFileSync(file, "utf8");
    const next = s
      .replace(/from "framer-motion"/g, 'from "@/lib/motion-stub"')
      .replace(/from 'framer-motion'/g, "from '@/lib/motion-stub'");
    if (next !== s) {
      fs.writeFileSync(file, next);
      n++;
    }
  }
}
console.log("Updated files:", n);
