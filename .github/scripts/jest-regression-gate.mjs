#!/usr/bin/env node
/**
 * Compare Jest JSON from HEAD vs TEST_BASE_SHA.
 * Exit 0 only when every HEAD failure already failed on base.
 * Exit 1 on new failures, missing inputs, or an unusable base report.
 */
import fs from "fs";

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function suiteKey(name) {
  const n = String(name).replace(/\\/g, "/");
  const idx = n.lastIndexOf("/tests/");
  if (idx >= 0) return n.slice(idx + 1);
  const alt = n.lastIndexOf("/__tests__/");
  if (alt >= 0) return n.slice(alt + 1);
  return n.replace(/^.*\//, "");
}

function failedKeys(report) {
  const keys = [];
  if (!report || !Array.isArray(report.testResults)) {
    die("BASELINE_REPRO_UNAVAILABLE");
  }
  for (const tr of report.testResults) {
    const file = suiteKey(tr.name);
    const failedNames = (tr.assertionResults || [])
      .filter((a) => a.status === "failed")
      .map((a) => a.fullName);
    if (tr.status === "failed" && failedNames.length === 0) {
      keys.push(`${file}::SUITE_FAILED_TO_RUN`);
      continue;
    }
    for (const name of failedNames) keys.push(`${file}::${name}`);
  }
  return keys;
}

function readJson(path) {
  if (!path || !fs.existsSync(path)) die(`BASELINE_REPRO_UNAVAILABLE missing ${path || "(empty path)"}`);
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    die("BASELINE_REPRO_UNAVAILABLE invalid json");
  }
}

function failedFiles(report) {
  const files = new Set();
  if (!report || !Array.isArray(report.testResults)) {
    die("BASELINE_REPRO_UNAVAILABLE");
  }
  for (const tr of report.testResults) {
    if (tr.status !== "failed") continue;
    files.add(suiteKey(tr.name));
  }
  return [...files];
}

const mode = process.argv[2];
if (mode === "--failed-files") {
  const report = readJson(process.argv[3]);
  process.stdout.write(failedFiles(report).join("\n"));
  process.exit(0);
}

const headPath = process.argv[2];
const basePath = process.argv[3];
if (!headPath || !basePath) die("usage: jest-regression-gate.mjs <head.json> <base.json>");

const head = readJson(headPath);
const base = readJson(basePath);

const headFailed = failedKeys(head);
const baseFailed = new Set(failedKeys(base));

if (head.success === true && headFailed.length === 0) {
  console.log("JEST_HEAD=PASS");
  process.exit(0);
}

const regressions = headFailed.filter((k) => !baseFailed.has(k));
console.log(`HEAD_FAILED=${headFailed.length}`);
console.log(`BASE_FAILED=${baseFailed.size}`);
console.log(`NEW_REGRESSIONS=${regressions.length}`);
for (const k of regressions) console.log(`NEW_REGRESSION ${k}`);
for (const k of headFailed) {
  if (baseFailed.has(k)) console.log(`BASELINE_FAILURE ${k}`);
}

if (regressions.length > 0) {
  console.log("CI_REGRESSION_FROM_PR=YES");
  process.exit(1);
}

if (headFailed.length === 0) {
  die("JEST_NONEMPTY_LIST_BUT_NO_TESTS_EXECUTED");
}

console.log("CI_REGRESSION_FROM_PR=NO");
console.log("BASELINE_FAILURES_NOT_REGRESSION");
process.exit(0);
