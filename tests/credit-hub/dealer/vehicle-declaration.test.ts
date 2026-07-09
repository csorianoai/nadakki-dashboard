import {
  buildDeclaracionVehiculoPayload,
  INITIAL_VEHICLE_DECLARATION,
  vehicleDeclarationComplete,
  vehicleDeclarationHasVisibleAlert,
  vehicleDeclarationQuestionsAnswered,
} from "@/lib/credit-hub/dealer/vehicle-declaration";

const answered = {
  ...INITIAL_VEHICLE_DECLARATION,
  vehicle_decl_perdida_total: "no" as const,
  vehicle_decl_accidentes: "no" as const,
  vehicle_decl_gravamenes: "no" as const,
  vehicle_decl_titulo_vendedor: "yes" as const,
  vehicle_decl_km_coincide: "yes" as const,
};

describe("vehicle-declaration", () => {
  test("incomplete when questions unanswered", () => {
    expect(vehicleDeclarationQuestionsAnswered(INITIAL_VEHICLE_DECLARATION)).toBe(false);
    expect(vehicleDeclarationComplete(INITIAL_VEHICLE_DECLARATION)).toBe(false);
  });

  test("complete with clean answers and signature", () => {
    const data = { ...answered, vehicle_decl_signature_name: "Juan Pérez", vehicle_decl_hash: "abc" };
    expect(vehicleDeclarationComplete(data)).toBe(true);
    expect(vehicleDeclarationHasVisibleAlert(data)).toBe(false);
  });

  test("perdida_total yes shows alert but can be complete", () => {
    const data = {
      ...answered,
      vehicle_decl_perdida_total: "yes" as const,
      vehicle_decl_signature_name: "Juan Pérez",
      vehicle_decl_hash: "abc",
      vehicle_decl_signed_at: "2026-07-09T10:30:00Z",
    };
    expect(vehicleDeclarationHasVisibleAlert(data)).toBe(true);
    expect(vehicleDeclarationComplete(data)).toBe(true);
  });

  test("payload includes firma and hash", () => {
    const payload = buildDeclaracionVehiculoPayload({
      ...answered,
      vehicle_decl_signature_name: "Juan Pérez",
      vehicle_decl_signed_at: "2026-07-09T10:30:00Z",
      vehicle_decl_hash: "sha256-deadbeef",
    });
    expect(payload?.firma_dealer).toBe("Juan Pérez");
    expect(payload?.fecha_firma).toBe("2026-07-09T10:30:00Z");
    expect(payload?.hash).toBe("sha256-deadbeef");
    expect(payload?.perdida_total).toBe(false);
  });
});
