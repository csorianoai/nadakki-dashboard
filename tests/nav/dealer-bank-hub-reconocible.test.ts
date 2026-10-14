import { entradasBuscador, NAVEGACION } from '@/lib/navigation';
import { filterSectionsForUser } from '@/components/forge/layout/forge-global-sidebar-nav';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const role = (role_key: string, core_name = 'credit') => ({ role_key, core_name, display_name: role_key });
const visible = (roles: ReturnType<typeof role>[], cores: string[]) => filterSectionsForUser(NAVEGACION, roles, cores, true);

describe('entrada reconocible Dealer Bank después del rediseño', () => {
  test('el acceso rápido de Inicio abre el selector, sin saltar directamente al banco', () => {
    const source = ts.createSourceFile('page.tsx', fs.readFileSync(path.join(process.cwd(), 'app/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const entries: Record<string, string>[] = [];
    function visit(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'QUICK_LINKS' && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        for (const element of node.initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          const item: Record<string, string> = {};
          for (const p of element.properties) {
            if (ts.isPropertyAssignment(p) && ts.isStringLiteral(p.initializer)) item[p.name.getText(source)] = p.initializer.text;
          }
          entries.push(item);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    expect(entries.find(item => item.label === 'Dealer Bank' || item.label === 'Credit Hub')?.href).toBe('/credit-hub');
  });
  test('el administrador encuentra el antiguo hub bajo Crédito por su nombre', () => {
    const menu = visible([role('platform_superadmin', 'platform')], []);
    const credit = menu.find(s => s.id === 'credit-hub')!;
    expect(credit.children.find(p => p.id === 'credit-home')).toMatchObject({label: 'Dealer Bank', href: '/credit-hub'});
    expect(menu.find(s => s.id === 'concesionarios')?.coreMatchers).toEqual(['autos']);
    expect(credit.coreMatchers).toEqual(['credit']);
  });
  test('el buscador conserva el nombre anterior y el término Centro de crédito', () => {
    const entries = entradasBuscador(visible([role('bank_analyst')], ['credit']));
    const hub = entries.find(p => p.href === '/credit-hub')!;
    expect(hub.label).toBe('Dealer Bank');
    expect(hub.keywords).toEqual(expect.arrayContaining(['centro de crédito', 'dealer bank', 'banco', 'concesionario']));
  });
  test('restaurar el nombre no concede crédito a un tenant que solo tiene autos', () => {
    const menu = visible([role('dealer')], ['autos']);
    expect(menu.find(s => s.id === 'credit-hub')).toBeUndefined();
    expect(entradasBuscador(menu).find(p => p.href === '/credit-hub')).toBeUndefined();
  });
  test('tenant_admin sigue dependiendo de los módulos de su tenant', () => {
    expect(visible([role('tenant_admin')], ['autos']).find(s => s.id === 'credit-hub')).toBeUndefined();
    expect(visible([role('tenant_admin')], ['credit']).find(s => s.id === 'credit-hub')).toBeDefined();
  });
  test('banco conserva Bank V2 y el concesionario conserva su portal', () => {
    const credit = visible([role('platform_superadmin')], []).find(s => s.id === 'credit-hub')!;
    expect(credit.children.find(p => p.id === 'credit-bank')?.href).toBe('/credit-hub/bank-v2');
    expect(credit.children.find(p => p.id === 'credit-dealer')?.href).toMatch(/^\/(?:credit-hub\/dealer|autos\/dealer\/credito)$/);
  });
});
