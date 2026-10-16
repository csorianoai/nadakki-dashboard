/** DB-CODEX-12B: el puntero del borrador (sessionStorage) guarda solo ids y se purga con el resto de borradores. */
import {
  buildWizardDraftPointerKey,
  clearWizardDraftPointer,
  listWizardDraftPointers,
  purgeAllWizardDrafts,
  readWizardDraftPointer,
  writeWizardDraftPointer,
} from "@/lib/credit-hub/dealer/wizard-draft-storage";

const KEY = buildWizardDraftPointerKey("tenant-p", "user-p");

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("el puntero guarda solo tenant y application_id, y se lee de vuelta", () => {
  writeWizardDraftPointer(KEY, { tenantId: "tenant-p", applicationId: "app-1" });
  expect(JSON.parse(sessionStorage.getItem(KEY) as string)).toEqual({ tenantId: "tenant-p", applicationId: "app-1" });
  expect(localStorage.length).toBe(0);
  expect(readWizardDraftPointer(KEY)).toEqual({ tenantId: "tenant-p", applicationId: "app-1" });
});

test("un puntero ilegible o de una versión anterior se ignora", () => {
  sessionStorage.setItem(KEY, "app-1");
  expect(readWizardDraftPointer(KEY)).toBeNull();
  expect(listWizardDraftPointers()).toEqual([]);
});

test("listWizardDraftPointers devuelve todos los punteros de la pestaña", () => {
  writeWizardDraftPointer(KEY, { tenantId: "tenant-p", applicationId: "app-1" });
  writeWizardDraftPointer(buildWizardDraftPointerKey("tenant-q", "user-q"), { tenantId: "tenant-q", applicationId: "app-2" });
  sessionStorage.setItem("otra-clave", "x");
  expect(listWizardDraftPointers()).toHaveLength(2);
});

test("clear y purgeAllWizardDrafts eliminan los punteros", () => {
  writeWizardDraftPointer(KEY, { tenantId: "tenant-p", applicationId: "app-1" });
  clearWizardDraftPointer(KEY);
  expect(sessionStorage.getItem(KEY)).toBeNull();
  writeWizardDraftPointer(KEY, { tenantId: "tenant-p", applicationId: "app-1" });
  purgeAllWizardDrafts();
  expect(sessionStorage.length).toBe(0);
});
