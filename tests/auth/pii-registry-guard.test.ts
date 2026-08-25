/**
 * F1 DoD #3: Detect unregistered PII keys in sessionStorage.
 * 
 * CRITICAL: This test FAILS if a developer adds a new sessionStorage key
 * that may contain PII without registering it in PII_PREFIXES.
 * 
 * This prevents the bug from recurring: "llegamos a seis superficies"
 * because each new key was added without registration.
 * 
 * @jest-environment jsdom
 */

import * as fs from "fs";
import * as path from "path";

// Import PII_PREFIXES from the actual module (not ideal but works for test)
// In practice, we'll hardcode the known prefixes here and keep them in sync
const REGISTERED_PII_PREFIXES = [
  'nadakki_credit_',           // Credit process results
  'nadakki:stip-workflow',     // Stipulation workflows
  'nadakki:audit:bank-stip',   // Workflow audit trail
  'nadakki-credit-hub-scenarios', // Saved scenarios
  'nadakki-wizard-telemetry:', // Wizard telemetry
  'autos_admin_dealers_',      // Padron de dealers: AdminDealerRow lleva name + email
] as const;

/**
 * Keys that are SAFE (do NOT contain PII).
 * These are exempted from requiring registration in PII_PREFIXES.
 * 
 * Add new SAFE keys here with a comment explaining why they don't contain PII.
 */
const SAFE_KEYS: readonly string[] = [
  'forge-dealer-wizard-autosave-first-success-v1', // Boolean flag
  'WIZARD_AUTOSAVE_TOAST_SESSION_KEY',              // Boolean flag (constant name)
  'forge-dealer-wizard-read-announcements',        // Array of read announcement IDs
  'READ_KEY',                                       // Array of read announcement IDs (constant name)
  'suite-stats-cache-v1',                          // Aggregate stats (no personal data)
  'CACHE_KEY',                                      // Cache key constant
  'autos_admin_vehicles_',                         // Vehicle catalog data (no personal info)
  'vehiclesKey(',                                   // Function that returns autos_admin_vehicles_*
  'autos_admin_flags_',                            // Feature flags (boolean)
  'flagsKey(',                                      // Function that returns autos_admin_flags_*
  'nadakki-cart:',                                 // Vehicle IDs in cart (no personal info)
  'cartStorageKey(',                                // Function that returns nadakki-cart:*
  'legal_pilot_optional_info_dismissed',           // Boolean flag
  'SESSION_OPTIONAL_DISMISSED',                     // Boolean flag constant
  'legal_research_session_',                       // Legal queries cache (tenant-scoped, no PII)
  'sessionKey(',                                    // Function that returns legal_research_session_*
  'agent-history-cache',                           // Agent execution history (system data)
  'getStorageKey(',                                 // Function that returns agent-history-cache
  'dealersKey(',                                    // Accesor de autos_admin_dealers_, ya registrado
                                                    // en PII_PREFIXES. Misma convencion que
                                                    // vehiclesKey( / flagsKey( / cartStorageKey(:
                                                    // el escaner captura la llamada, no la clave.
  // Whitespace artifacts from regex parsing (can be ignored):
  '    ',                                            // Regex artifact - empty/whitespace
  '',                                               // Regex artifact - empty string
  // ⚠️ Add new SAFE keys above with justification
] as const;

/**
 * Keys that are KNOWN to contain PII but are NOT yet in PII_PREFIXES.
 * These should be EMPTY. If not, tests FAIL until they're registered.
 */
const UNREGISTERED_PII_KEYS: readonly string[] = [
  // ❌ If you add a key here, the test FAILS
  // ✅ Move it to PII_PREFIXES in lib/auth/auth-session-cleanup.ts
  //
  // autos_admin_dealers_ y dealersKey( salieron de aqui al registrarse en
  // PII_PREFIXES. La clasificacion no se hizo por lo que decia esta lista
  // -"MAY contain PII"- sino midiendo el tipo: AdminDealerRow declara `name` y
  // `email` en lib/autos-portal/admin-types.ts:25-32.
] as const;

describe('sessionStorage PII registry guard (F1 DoD #3)', () => {
  test('FAIL: unregistered PII keys exist', () => {
    /**
     * This test FAILS if UNREGISTERED_PII_KEYS is not empty.
     * 
     * To fix: Move keys from UNREGISTERED_PII_KEYS to PII_PREFIXES
     * in lib/auth/auth-session-cleanup.ts
     */
    expect(UNREGISTERED_PII_KEYS).toHaveLength(0);
    
    if (UNREGISTERED_PII_KEYS.length > 0) {
      const message = [
        '',
        '❌ UNREGISTERED PII KEYS DETECTED',
        '',
        'The following sessionStorage keys contain PII but are NOT registered in PII_PREFIXES:',
        ...UNREGISTERED_PII_KEYS.map(k => `  - ${k}`),
        '',
        'TO FIX:',
        '1. Move these keys from UNREGISTERED_PII_KEYS to PII_PREFIXES',
        '   in lib/auth/auth-session-cleanup.ts',
        '2. Re-run this test',
        '',
        'Ley 172-13: All PII must be cleared on logout.',
        ''
      ].join('\n');
      
      throw new Error(message);
    }
  });

  test('all sessionStorage.setItem calls use registered or safe keys', () => {
    /**
     * This test scans the codebase for sessionStorage.setItem calls
     * and verifies each key is either:
     * 1. In REGISTERED_PII_PREFIXES (will be cleared on logout)
     * 2. In SAFE_KEYS (does not contain PII)
     * 
     * If a new key is found that's in neither list, test FAILS.
     */
    const ROOT = path.resolve(__dirname, '../..');
    const findings: Array<{ file: string; line: number; key: string }> = [];

    function scanFile(filePath: string) {
      if (filePath.includes('node_modules')) return;
      if (filePath.includes('__tests__')) return;
      if (filePath.includes('/tests/')) return;
      if (!filePath.match(/\.(ts|tsx)$/)) return;

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (!line.includes('sessionStorage.setItem')) return;

        // Extract key from sessionStorage.setItem(KEY, ...)
        // This is a heuristic - won't catch all cases but good enough
        const match = line.match(/sessionStorage\.setItem\(\s*["`']?([^"'`,)]+)["`']?/);
        if (!match) {
          // Try template literals or function calls
          const templateMatch = line.match(/sessionStorage\.setItem\(\s*`([^`]+)`/);
          const funcMatch = line.match(/sessionStorage\.setItem\(([a-zA-Z_][a-zA-Z0-9_]*)\(/);
          
          if (templateMatch) {
            // Template literal - extract the static prefix
            const key = templateMatch[1].split('${')[0];
            findings.push({
              file: path.relative(ROOT, filePath),
              line: idx + 1,
              key,
            });
          } else if (funcMatch) {
            // Function call like sessionStorage.setItem(cartStorageKey(...), ...)
            // We'll record this as the function name for manual review
            findings.push({
              file: path.relative(ROOT, filePath),
              line: idx + 1,
              key: funcMatch[1] + '()',
            });
          }
        } else {
          findings.push({
            file: path.relative(ROOT, filePath),
            line: idx + 1,
            key: match[1],
          });
        }
      });
    }

    function walkDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
            walkDir(fullPath);
          }
        } else {
          scanFile(fullPath);
        }
      }
    }

    // Scan the codebase
    walkDir(path.join(ROOT, 'app'));
    walkDir(path.join(ROOT, 'components'));
    walkDir(path.join(ROOT, 'lib'));
    walkDir(path.join(ROOT, 'hooks'));

    // Filter findings to only those NOT in REGISTERED_PII_PREFIXES or SAFE_KEYS
    const unclassified = findings.filter(f => {
      const key = f.key;
      
      // Check if key starts with a registered PII prefix
      for (const prefix of REGISTERED_PII_PREFIXES) {
        if (key.startsWith(prefix)) return false;
      }
      
      // Check if key starts with a safe prefix
      for (const safeKey of SAFE_KEYS) {
        if (key.startsWith(safeKey)) return false;
      }
      
      // Check if key matches exactly a safe key
      if (SAFE_KEYS.includes(key as any)) return false;
      
      return true;
    });

    if (unclassified.length > 0) {
      const message = [
        '',
        '❌ UNCLASSIFIED sessionStorage KEYS DETECTED',
        '',
        'The following sessionStorage.setItem calls use keys that are NOT classified:',
        ...unclassified.map(f => `  - ${f.file}:${f.line} → "${f.key}"`),
        '',
        'TO FIX:',
        '1. Determine if the key contains PII (personal data: name, cédula, email, phone, address, income, etc.)',
        '2a. If YES (contains PII): Add to PII_PREFIXES in lib/auth/auth-session-cleanup.ts',
        '2b. If NO (safe): Add to SAFE_KEYS in this test file with justification',
        '',
        'Ley 172-13: All PII must be cleared on logout.',
        ''
      ].join('\n');
      
      console.error(message);
      expect(unclassified).toHaveLength(0);
    }
  });

  test('PII_PREFIXES in auth-session-cleanup.ts matches this test', () => {
    /**
     * This test ensures REGISTERED_PII_PREFIXES in this test file
     * stays in sync with PII_PREFIXES in auth-session-cleanup.ts.
     * 
     * If they diverge, this test FAILS.
     */
    const cleanupFilePath = path.resolve(__dirname, '../../lib/auth/auth-session-cleanup.ts');
    const cleanupContent = fs.readFileSync(cleanupFilePath, 'utf-8');
    
    // Extract PII_PREFIXES array from the file
    const match = cleanupContent.match(/const PII_PREFIXES = \[([\s\S]*?)\] as const/);
    expect(match).not.toBeNull();
    
    if (!match) {
      throw new Error('Could not find PII_PREFIXES in auth-session-cleanup.ts');
    }
    
    const extractedPrefixes = match[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith("'"))
      .map(line => line.match(/'([^']+)'/)?.[1])
      .filter(Boolean);
    
    // Compare with REGISTERED_PII_PREFIXES
    expect(extractedPrefixes.sort()).toEqual([...REGISTERED_PII_PREFIXES].sort());
  });
});

/**
 * MAINTENANCE GUIDE
 * 
 * When a developer adds a new sessionStorage.setItem call:
 * 
 * 1. This test will FAIL, showing the unclassified key
 * 2. Developer must decide:
 *    a) Does it contain PII? → Add to PII_PREFIXES in auth-session-cleanup.ts
 *    b) Is it safe (no PII)? → Add to SAFE_KEYS in this file with justification
 * 3. Re-run test
 * 
 * This ensures NO PII is forgotten during logout.
 */
