import {
  APPLICANT_ENDPOINT_FIELDS,
  EDITABLE_ENDPOINT_FIELDS,
  VEHICLE_ENDPOINT_FIELDS,
  unknownWizardEndpointFields,
} from "@/lib/credit-hub/dealer/wizard-endpoint-contract";

describe("wizard endpoint contract guard", () => {
  test("declared endpoint lists are not empty", () => {
    expect(APPLICANT_ENDPOINT_FIELDS.length).toBeGreaterThan(0);
    expect(VEHICLE_ENDPOINT_FIELDS.length).toBeGreaterThan(0);
    expect(EDITABLE_ENDPOINT_FIELDS.length).toBeGreaterThan(0);
  });

  test("wizard payload keys are covered by their endpoint", () => {
    expect(unknownWizardEndpointFields("applicant", ["name", "cedula", "referencias"])).toEqual([]);
    expect(unknownWizardEndpointFields("vehicle", ["make", "vehicle_value", "km_odometro"])).toEqual([]);
    expect(unknownWizardEndpointFields("editable", ["email", "plazo_meses", "referencias_personales"])).toEqual([]);
  });

  test("mutation: an unrecognized key fails the guard", () => {
    expect(unknownWizardEndpointFields("applicant", ["name", "full_name"])).toEqual(["full_name"]);
  });
});
