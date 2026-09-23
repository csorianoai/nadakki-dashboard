import {
  DEALER_REGISTER_CAPABILITY,
  DEALER_VEHICLE_CAPABILITY,
} from "@/lib/dealer/capabilities";
import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

describe("dealer page capabilities", () => {
  test("ficha and register keys are 097 catalog only", () => {
    const invented = ["autos.inventory.view", "autos.inventory.write"];
    for (const key of [DEALER_VEHICLE_CAPABILITY, DEALER_REGISTER_CAPABILITY]) {
      expect(MIGRATION_097_CAPABILITY_KEYS.has(key)).toBe(true);
      expect(invented).not.toContain(key);
    }
  });
});
