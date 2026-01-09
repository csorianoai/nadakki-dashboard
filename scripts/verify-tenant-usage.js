// scripts/verify-tenant-usage.js
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let hasIssues = false;
  const issues = [];
  
  // Regla 1: Server Components no pueden usar useTenant()
  const isClientComponent = content.includes('"use client"');
  const usesUseTenant = content.includes('useTenant()');
  
  if (!isClientComponent && usesUseTenant) {
    hasIssues = true;
    issues.push('❌ Server Component usando useTenant() - DEBE ser Client Component');
  }
  
  // Regla 2: Verificar imports correctos
  const hasCorrectImport = content.includes('from "@/contexts/TenantContext"') || 
                          content.includes("from '@/contexts/TenantContext'");
  
  if (usesUseTenant && !hasCorrectImport) {
    hasIssues = true;
    issues.push('⚠️  Import incorrecto de useTenant');
  }
  
  // Regla 3: Verificar dynamic export para páginas críticas
  const isPage = filePath.includes('/app/') && filePath.includes('/page.tsx');
  const hasDynamicExport = content.includes('export const dynamic') || 
                          content.includes('export const revalidate');
  
  if (isPage && usesUseTenant && !hasDynamicExport) {
    issues.push('💡 Considera agregar: export const dynamic = "force-dynamic"');
  }
  
  if (hasIssues || issues.length > 0) {
    console.log(`\n📄 ${path.relative(rootDir, filePath)}:`);
    issues.forEach(issue => console.log(`  ${issue}`));
    
    if (hasIssues) {
      return false;
    }
  }
  
  return true;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let allValid = true;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && 
        !file.includes('node_modules') && 
        !file.startsWith('.') &&
        !file.includes('.next')) {
      if (!walkDir(filePath)) {
        allValid = false;
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (!checkFile(filePath)) {
        allValid = false;
      }
    }
  }
  
  return allValid;
}

console.log('🔍 Verificando uso correcto de Tenant Context...');
const isValid = walkDir(path.join(rootDir, 'app'));

if (isValid) {
  console.log('\n✅ TODOS los archivos son válidos!');
  process.exit(0);
} else {
  console.log('\n❌ Se encontraron problemas. Corrige antes de build.');
  process.exit(1);
}
