import { propertyIntelHref } from "../propertyIntelHref";

const ID = "0b9f6d3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f";

it("(c) señal con property_id → href a PI-D2", () => {
  expect(propertyIntelHref({ kind: "k", property_id: ID })).toBe(`/realtor/property-intel/${ID}`);
});
it("(c) señal con property_unit_id → href con ?unit", () => {
  expect(propertyIntelHref({ kind: "k", property_unit_id: ID })).toBe(`/realtor/property-intel/${ID}?unit=${ID}`);
});
it("(c) sin id, o id no UUID → ningún enlace", () => {
  expect(propertyIntelHref({ kind: "keyword_stats" })).toBeNull();
  expect(propertyIntelHref({ kind: "k", property_id: "x" })).toBeNull();
});
