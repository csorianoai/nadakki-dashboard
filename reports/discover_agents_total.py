#!/usr/bin/env python3
"""
NADAKKI AI Suite - Total Agent Discovery v2.0
Sin depender de patrones de nombre (*IA.py, *Agent.py)
Análisis semántico completo
"""
import os, re, json, ast, hashlib, sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════════════════

AGENTS_ROOT = Path.cwd() / "agents"

FOLDER_BLACKLIST = {
    "__pycache__", ".git", ".venv", "venv", "node_modules",
    "backup", "legacy", "tests", "testing", "test", ".pytest_cache"
}

# Señales AI/Decisioning
AI_KEYWORDS = [
    "openai","anthropic","claude","gpt","llm","embedding","chatcompletion",
    "pydantic","fastapi","langchain","llamaindex","crewai",
    "predict","classification","scoring","risk","decision","automation","orchestrat","workflow"
]

# Clases con comportamiento autónomo
AUTONOMOUS_CLASS_HINTS = [
    "agent","ia","assistant","orchestrator","coordinator","manager","optimizer","strategist",
    "controller","sentinel","profiler","oracle","tester","pathway","recovery","collection"
]

# Anticipo: utilitarios puros
UTILS_ANTI = [
    "argparse","click","typer","logging",'if __name__ == "__main__"'
]

# Plataformas en marketing
PLATFORM_RULES = {
    "google_ads": ["google","ads","adwords","gads","rsa","search terms"],
    "meta_ads": ["facebook","instagram","meta","lookalike","pixel"],
    "linkedin_ads": ["linkedin","sponsored"],
    "tiktok_ads": ["tiktok","spark ads"],
}

# Categorías
CATEGORY_RULES = [
    (("penal","procesal","constitucional","civil","laboral","tribut","comercial","migr","ambient"), "legal"),
    (("campaign","ads","keyword","roas","ctr","conversion","creative","audience"), "marketing_ads"),
    (("factur","fiscal","reconcili","contab","flujo","balance","auditor"), "accounting"),
    (("logistic","invent","warehouse","rutas","transporte","trazabil","demanda"), "logistics"),
    (("rrhh","nomina","cv","talent","seleccion"), "hr"),
    (("presupuesto","forecast","budget","planificacion"), "budgeting"),
    (("investig","tendencia","innovacion"), "research"),
    (("ventas","crm","pipeline","cliente","lifecycle"), "sales"),
    (("aml","regtech","compliance","kyc"), "compliance"),
    (("recovery","recuper","cobro","collection"), "recovery"),
    (("originacion","underwrite","sentinel","profiler"), "origination"),
    (("coordinador","orchestrator"), "coordination"),
]

# Mapeo módulos
MODULE_MAP = {
    "marketing":"marketing",
    "legal":"legal",
    "contabilidad":"contabilidad",
    "logistica":"logistica",
    "presupuesto":"presupuesto",
    "rrhh":"rrhh",
    "educacion":"educacion",
    "investigacion":"investigacion",
    "ventascrm":"ventascrm",
    "regtech":"regtech",
    "recuperacion":"recuperacion",
    "originacion":"originacion"
}

# Inventario esperado (confirmado)
EXPECTED = {
    "marketing":44,"legal":33,"contabilidad":21,"logistica":23,
    "presupuesto":13,"rrhh":10,"educacion":9,"investigacion":9,
    "ventascrm":9,"regtech":8,"recuperacion":5,"originacion":10,"otros":20
}

# ═══════════════════════════════════════════════════════════════════════════
# FUNCIONES
# ═══════════════════════════════════════════════════════════════════════════

def safe_read(fp):
    for enc in ["utf-8","latin-1","cp1252","iso-8859-1"]:
        try: return fp.read_text(encoding=enc)
        except: pass
    return ""

def parse_ast(content):
    try: return ast.parse(content)
    except: return ast.Module(body=[],type_ignores=[])

def has_fn(tree, names):
    for n in tree.body:
        if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name in names:
            return True
    return False

def has_method(tree, names):
    for n in ast.walk(tree):
        if isinstance(n,ast.ClassDef):
            for b in n.body:
                if isinstance(b,(ast.FunctionDef,ast.AsyncFunctionDef)) and b.name in names:
                    return True
    return False

def has_auto_class(tree):
    for n in ast.walk(tree):
        if isinstance(n,ast.ClassDef):
            nm = (n.name or "").lower()
            if any(h in nm for h in AUTONOMOUS_CLASS_HINTS):
                return True
    return False

def has_ai(cl):
    return any(k in cl for k in AI_KEYWORDS)

def is_utils(cl, lines):
    if lines < 40 and sum(1 for u in UTILS_ANTI if u in cl) >= 2:
        return True
    return False

def det_module(parts):
    if not parts: return "otros"
    return MODULE_MAP.get(parts[0].lower(),"otros")

def det_platform(mod, parts, cl):
    if mod != "marketing": return None
    for p, kws in PLATFORM_RULES.items():
        if any(k in cl for k in kws):
            return p
    return None

def det_category(cl, parts):
    scope = cl + " " + " ".join(parts)
    for kws, cat in CATEGORY_RULES:
        if any(k in scope for k in kws):
            return cat
    return "general"

def det_status(tree, cl):
    if has_fn(tree,{"execute","run"}) or has_method(tree,{"execute","run"}):
        return "active"
    elif has_ai(cl) or has_auto_class(tree):
        return "configured"
    return "template"

def det_reason(tree, cl, lines):
    reasons = []
    if has_fn(tree,{"execute","run"}): reasons.append("execute_function")
    if has_method(tree,{"execute","run"}): reasons.append("class_execute_method")
    if has_auto_class(tree): reasons.append("autonomous_class")
    if has_ai(cl): reasons.append("ai_ml_signals")
    if lines > 50: reasons.append("substantial_lines")
    return " | ".join(reasons[:3]) if reasons else "heuristic"

# ═══════════════════════════════════════════════════════════════════════════
# DESCUBRIMIENTO
# ═══════════════════════════════════════════════════════════════════════════

agents = []
by_module = {}
files_total = 0
files_ignored = 0

for fp in sorted(AGENTS_ROOT.rglob("*.py")):
    files_total += 1
    
    # Skip blacklist
    if any(b in [p.lower() for p in fp.parts] for b in FOLDER_BLACKLIST):
        files_ignored += 1
        continue
    
    # Read
    content = safe_read(fp)
    if not content.strip(): continue
    
    lines = content.count("\n") + 1
    cl = content.lower()
    rel = str(fp.relative_to(AGENTS_ROOT)).replace("\\","/")
    parts = rel.split("/")[:-1]
    
    # Parse
    tree = parse_ast(content)
    
    # REGLA: ES AGENTE SI CUMPLE AL MENOS UNO
    rule1 = has_fn(tree, {"execute","run"})
    rule2 = has_method(tree, {"execute","run"})
    rule3 = has_auto_class(tree)
    rule4 = has_ai(cl)
    rule5 = (lines > 50 and not is_utils(cl, lines))
    
    if not any([rule1,rule2,rule3,rule4,rule5]):
        continue
    
    # Clasificar
    mod = det_module(parts)
    plat = det_platform(mod, parts, cl)
    cat = det_category(cl, parts)
    status = det_status(tree, cl)
    reason = det_reason(tree, cl, lines)
    
    h = hashlib.md5(rel.encode()).hexdigest()[:4]
    aid = Path(fp.name).stem.lower().replace("-","_") + f"_{h}"
    
    agents.append({
        "agent_id": aid,
        "filename": fp.name,
        "file_path": rel,
        "module": mod,
        "platform": plat,
        "category": cat,
        "status": status,
        "lines": lines,
        "reason_detected": reason
    })
    by_module[mod] = by_module.get(mod, 0) + 1

# ═══════════════════════════════════════════════════════════════════════════
# REPORTE
# ═══════════════════════════════════════════════════════════════════════════

inventory = {
    "generated_at": datetime.now().isoformat() + "Z",
    "discovery_method": "semantic_analysis",
    "agents_path": str(AGENTS_ROOT),
    "total_agents_found": len(agents),
    "by_module": dict(sorted(by_module.items())),
    "agents": agents
}

validation = {
    "expected_inventory": EXPECTED,
    "found_inventory": dict(sorted(by_module.items())),
    "comparison": {},
    "summary": {
        "files_total": files_total,
        "files_ignored": files_ignored,
        "agents_found": len(agents)
    }
}

for mod, exp in EXPECTED.items():
    found = by_module.get(mod, 0)
    validation["comparison"][mod] = {
        "expected": exp,
        "found": found,
        "missing": max(exp-found, 0),
        "status": "✅" if found>=exp else f"⚠️ ({found}/{exp})"
    }

# Save
Path("./reports/agents_inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2))
Path("./reports/agents_validation.json").write_text(json.dumps(validation, ensure_ascii=False, indent=2))

# Print
print("="*100)
print(f"✅ Total agentes encontrados: {len(agents)}")
print(f"📁 Archivos procesados: {files_total-files_ignored}/{files_total}")
print(f"\n📊 Por módulo:")
for m in sorted(by_module.keys()):
    exp = EXPECTED.get(m, 0)
    found = by_module[m]
    match = "✅" if found>=exp else f"⚠️({found}/{exp})"
    print(f"  {match} {m:15} {found:3} agentes")
print("\n" + "="*100)
print(f"📄 Reportes guardados en ./reports/")
print("="*100)
