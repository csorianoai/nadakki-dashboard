/**
 * Listados simulados para tests (no se importan en producción).
 * Siguen el formato RESO OData que devuelve Bridge Interactive.
 */

export const MOCK_BRIDGE_RESPONSE = {
  "@odata.context": "https://api.bridgedataoutput.com/api/v2/OData/$metadata#Property",
  "@odata.count": 2,
  value: [
    {
      ListingKey: "FL123456001",
      ListPrice: 549000,
      StandardStatus: "Active",
      StreetNumber: "1250",
      StreetName: "Brickell",
      StreetSuffix: "Ave",
      City: "Miami",
      StateOrProvince: "FL",
      PostalCode: "33131",
      PropertyType: "Residential",
      PropertySubType: "Condominium",
      BedroomsTotal: 2,
      BathroomsTotalInteger: 2,
      LivingArea: 1100,
      ListOfficeName: "Courtesy of Sample Realty Group",
      PhotosCount: 12,
      ModificationTimestamp: "2026-11-01T10:00:00Z",
    },
    {
      ListingKey: "FL123456002",
      ListPrice: 1250000,
      StandardStatus: "Active",
      StreetNumber: "900",
      StreetName: "South Miami",
      StreetSuffix: "Ave",
      City: "Miami",
      StateOrProvince: "FL",
      PostalCode: "33130",
      PropertyType: "Residential",
      PropertySubType: "Single Family Residence",
      BedroomsTotal: 4,
      BathroomsTotalInteger: 3,
      LivingArea: 2800,
      ListOfficeName: "Courtesy of Premier Homes LLC",
      PhotosCount: 20,
      ModificationTimestamp: "2026-11-05T14:30:00Z",
    },
  ],
};

/** Respuesta de Bridge con dataset vacío (MIAMI pendiente de aprobación). */
export const MOCK_EMPTY_RESPONSE = {
  "@odata.context": "https://api.bridgedataoutput.com/api/v2/OData/$metadata#Property",
  "@odata.count": 0,
  value: [],
};
