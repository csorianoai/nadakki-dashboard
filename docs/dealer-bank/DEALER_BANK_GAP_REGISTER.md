gap_id,priority,component,status,root_cause,fix,verified_e2e,production_verified
P0-001,PRODUCTION_500,vehicle_detail,ROOT_CAUSE_CONFIRMED,SQLAlchemy text() + :param::uuid syntax error,CAST(:vehicle_id AS uuid) in search_service.py,no,no
P0-002,BROKEN_CONTRACT,finance_api,DISCOVERED,Frontend schema price_rd vs backend vehicle_price,Align lib/api/finance.ts to backend contract,no,no
P0-003,BROKEN_CONTRACT,reverse_auction,DISCOVERED,/api/v1/autos/finance/* 404; Credit Hub v2 canonical,Bridge or document v2 as SoT,no,no
P0-004,MANDATORY_E2E,admin_cockpit,DISCOVERED,app/admin/autos absent on branch,Merge AP-4 admin autos routes,no,no
P0-005,FAILED_TESTS,frontend_jest,DISCOVERED,89 failures in full suite (WizardContainer credit-hub),Triage and fix failing suites,no,no
P0-006,FAILED_TESTS,backend_pytest,PARTIAL,1599/1601 autos_portal pass; 2 flaky financing_leads,Stabilize test isolation,no,no
P0-007,PERFORMANCE,vehicle_search,REPRODUCED,p95 ~1112ms vs 500ms target,Index/query optimization,no,no
P0-008,SECURITY_CRITICAL,mis_leads_auth,REPRODUCED,POST /api/v1/autos/leads 401 without JWT,Public lead path or auth UX bridge,no,no
P0-009,UNIVERSAL_INVENTORY,price_auth,IMPLEMENTING,Legacy entitlements could enforce plan limits on inventory keys,universal_baseline.py bypass,yes_local,no
P0-010,UNIVERSAL_INVENTORY,vehicle_quota,DISCOVERED,No hardcoded max_vehicles in code; DB NULL limits,Monitor; enforce universal in resolver,yes_local,no
GAP-F3,effective_capabilities,entitlements_api,IMPLEMENTING,Frontend calls /api/v1/autos/entitlements/*; backend has /api/v1/access/*,Wire client to effective-capabilities,no,no
GAP-F8,admin_cockpit,admin_ui,DISCOVERED,Missing admin autos UI,Implement AP-4,no,no
GAP-F13,e2e_suite,testing,UNKNOWN,E2E-01–15 not executed,Run mandatory E2E harness,no,no
