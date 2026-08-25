/**
 * F1 DoD #3: every browser-storage write is classified for logout cleanup.
 *
 * This guard reads the production PII registry and inspects storage writes from
 * the TypeScript AST. It must fail when a new storage key is introduced without
 * either a PII prefix or an explicit safe-key classification.
 *
 * @jest-environment jsdom
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import ts from "typescript";

type StorageWrite = {
  file: string;
  line: number;
  storage: "localStorage" | "sessionStorage";
  key: string;
};

/** Safe browser-storage prefixes. These values do not contain user data. */
const SAFE_KEYS = [
  "forge-dealer-wizard-autosave-first-success-v1", "forge-dealer-wizard-read-announcements",
  "suite-stats-cache-v1", "autos_admin_vehicles_", "autos_admin_flags_", "nadakki-cart:",
  "legal_pilot_optional_info_dismissed", "legal_research_session_", "agent-history-cache",
  "nadakki_experiments_v1", "nadakki_sic_token", "nadakki-theme", "nadakki_shopper_user_id",
  "nadakki_shopper_profile", "nadakki_shopper_matches", "nadakki_shopper_notified",
  "nadakki_onboarding_", "nps_last_shown", "nadakki-live-tenant", "nadakki-vdp-chat",
  "nadakki:sidebar", "nadakki:legal:", "nadakki:demo:", "nadakki_live_tenant", "autos_cart_",
  "nadakki_dealer_notifications_read_v1", "nadakki_insights_", "nadakki_leads_contacted",
  "nadakki_refresh_token_v2", "nadakki_nps_last_shown", "nadakki_tenant_onboarding_draft_v1",
  "legal_post_sello_accepted", "legal_demo_accepted", "nadakki_pwa_dismiss_until", "nadakki_pwa_visits",
  "sidebar_stats", "lastInstitution", "forge-global-sidebar-expanded-v2", "nadakki-sidebar-collapsed",
  "nadakki-autos-tenant", "nadakki-autos-theme", "nadakki_vchat_", "nadakki_ch_onboarding_done_v1",
  "nadakki_legal_demo_banner_dismissed",
  "nadakki:marketing-onboarding:", "WIZARD_AUTOSAVE_TOAST_SESSION_KEY",
  "CACHE_KEY", "READ_KEY", "SESSION_OPTIONAL_DISMISSED", "LIVE_TENANT_KEY", "REFRESH_TOKEN_KEY",
  "LS_KEYS", "STORAGE_KEY", "storageKey", "storageKeyV2", "STORAGE_KEY_V2", "STORAGE_KEY_LEGACY",
  "VISIT_KEY", "DISMISS_KEY", "ONBOARDING_STORAGE_KEY", "NPS_LAST_SHOWN_KEY", "draftKey", "key",
  "contactedKey", "cacheKey", "PROFILE_KEY", "MATCHES_KEY", "NOTIFIED_KEY", "storageKey(",
  "cartStorageKey(", "vehiclesKey(", "flagsKey(", "sessionKey(", "getStorageKey(",
] as const;

const ROOT = path.resolve(__dirname, "../..");
const SOURCE_ROOTS = ["app", "components", "lib", "hooks"];

function sourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== ".next") {
        files.push(...sourceFiles(fullPath));
      }
    } else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function stringValue(node: ts.Expression): string | undefined {
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) return stringValue(node.expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = stringValue(node.left);
    const right = stringValue(node.right);
    if (left !== undefined && right !== undefined) return left + right;
  }
  return undefined;
}

function registryPrefixes(): string[] {
  const filePath = path.join(ROOT, "lib/auth/auth-session-cleanup.ts");
  const source = ts.createSourceFile(filePath, fs.readFileSync(filePath, "utf8"), ts.ScriptTarget.Latest, true);
  const prefixes: string[] = [];
  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (declaration.name.getText(source) !== "PII_PREFIXES" || !declaration.initializer) continue;
      const initializer = ts.isAsExpression(declaration.initializer) ? declaration.initializer.expression : declaration.initializer;
      if (!ts.isArrayLiteralExpression(initializer)) continue;
      for (const element of initializer.elements) {
        const value = stringValue(element as ts.Expression);
        if (value !== undefined) prefixes.push(value);
      }
    }
  });
  return prefixes;
}

function collectDeclarations(files: string[]): Map<string, ts.Expression> {
  const declarations = new Map<string, ts.Expression>();
  for (const file of files) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) declarations.set(node.name.text, node.initializer);
      if (ts.isFunctionDeclaration(node) && node.name) {
        const returned = node.body?.statements.find(ts.isReturnStatement)?.expression;
        if (returned) declarations.set(node.name.text, returned);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return declarations;
}

function keyPrefix(node: ts.Expression, declarations: Map<string, ts.Expression>, seen = new Set<string>()): string {
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) return keyPrefix(node.expression, declarations, seen);
  if (ts.isConditionalExpression(node)) return keyPrefix(node.whenTrue, declarations, seen);
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const body = ts.isBlock(node.body) ? node.body.statements.find(ts.isReturnStatement)?.expression : node.body;
    return body ? keyPrefix(body, declarations, seen) : node.getText();
  }
  const direct = stringValue(node);
  if (direct !== undefined) return direct;
  if (ts.isIdentifier(node)) {
    if (seen.has(node.text)) return node.text;
    const initializer = declarations.get(node.text);
    if (initializer) {
      const next = new Set(seen);
      next.add(node.text);
      return keyPrefix(initializer, declarations, next);
    }
    return node.text;
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    if (node.expression.text === "useMemo" && node.arguments[0]) {
      return keyPrefix(node.arguments[0], declarations, seen);
    }
    const resolved = declarations.get(node.expression.text);
    return resolved ? keyPrefix(resolved, declarations, seen) : `${node.expression.text}(`;
  }
  return node.getText();
}

function isStorageSetItem(node: ts.CallExpression): { storage: "localStorage" | "sessionStorage"; key: ts.Expression } | undefined {
  if (!ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== "setItem") return undefined;
  const storage = node.expression.expression.getText().replace(/^window\./, "");
  if (storage !== "localStorage" && storage !== "sessionStorage") return undefined;
  const key = node.arguments[0];
  return key ? { storage, key } : undefined;
}

function scanStorageWrites(roots: string[]): StorageWrite[] {
  const files = roots.flatMap(sourceFiles);
  const globalDeclarations = collectDeclarations(files);
  const findings: StorageWrite[] = [];
  for (const file of files) {
    const declarations = new Map([...globalDeclarations, ...collectDeclarations([file])]);
    const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const write = isStorageSetItem(node);
        if (write) findings.push({
          file: path.relative(ROOT, file),
          line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
          storage: write.storage,
          key: keyPrefix(write.key, declarations),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return findings;
}

function unclassifiedWrites(findings: StorageWrite[]): StorageWrite[] {
  const piiPrefixes = registryPrefixes();
  return findings.filter(({ key }) => ![...piiPrefixes, ...SAFE_KEYS].some(prefix => key.startsWith(prefix) || prefix.startsWith(key)));
}

function assertClassified(findings: StorageWrite[]): void {
  const unclassified = unclassifiedWrites(findings);
  if (unclassified.length === 0) return;
  const message = unclassified.map(({ file, line, storage, key }) => `  - ${file}:${line} ${storage}.setItem -> ${key}`).join("\n");
  throw new Error(`Unclassified browser-storage keys:\n${message}\n\nRegister a PII prefix or document a safe prefix in SAFE_KEYS.`);
}

describe("browser storage PII registry guard (F1 DoD #3)", () => {
  test("all localStorage and sessionStorage.setItem calls are classified", () => {
    expect(() => assertClassified(scanStorageWrites(SOURCE_ROOTS.map(root => path.join(ROOT, root))))).not.toThrow();
  });

  test("mutation: a new unclassified setItem fails the guard", () => {
    const mutationRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pii-registry-guard-"));
    try {
      fs.writeFileSync(path.join(mutationRoot, "mutation.ts"), 'sessionStorage.setItem("new_unclassified_pii_key", "value");\nlocalStorage.setItem("another_unclassified_key", "value");\n');
      expect(() => assertClassified(scanStorageWrites([mutationRoot]))).toThrow("new_unclassified_pii_key");
    } finally {
      fs.rmSync(mutationRoot, { recursive: true, force: true });
    }
  });
});
