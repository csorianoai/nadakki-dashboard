const { execFileSync } = require("node:child_process");

const COPY_PREFIXES = [
  "app/credit/",
  "app/bank/",
  "app/(bank)/",
  "components/forge/credit-hub/",
];

function isNonLiveCopyPath(file) {
  return COPY_PREFIXES.some((prefix) => file.replaceAll("\\", "/").startsWith(prefix));
}

function assessCopyIntent(files, body) {
  const affectedFiles = files.filter(isNonLiveCopyPath);
  const declared = /\bCOPIA_INTENCIONAL\b/.test(body || "");
  return { affectedFiles, declared, ok: affectedFiles.length === 0 || declared };
}

function changedFiles() {
  if (process.env.COPY_GUARD_FILES) return process.env.COPY_GUARD_FILES.split("|").filter(Boolean);
  const base = process.env.BASE_SHA || "HEAD^";
  const head = process.env.HEAD_SHA || "HEAD";
  return execFileSync("git", ["diff", "--name-only", base, head], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
}

if (require.main === module) {
  const result = assessCopyIntent(changedFiles(), process.env.PR_BODY || "");
  if (!result.ok) {
    console.error("COPIA_INTENCIONAL requerida para cambios en copias sin enlace:");
    for (const file of result.affectedFiles) console.error(`- ${file}`);
    process.exitCode = 1;
  } else {
    console.log(result.affectedFiles.length ? "Copia no viva declarada: COPIA_INTENCIONAL" : "Sin cambios en copias no vivas");
  }
}

module.exports = { assessCopyIntent, isNonLiveCopyPath };
