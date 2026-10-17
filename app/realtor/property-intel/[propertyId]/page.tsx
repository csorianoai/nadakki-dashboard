import { PropertyIntelScreen } from "@/components/realtor/property-intel/PropertyIntelScreen";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** /realtor/property-intel/<propiedad>[?unit=<unidad>]. Un id que no es UUID no llama a nada. */
export default async function PropertyIntelPage({ params, searchParams }: {
  params: Promise<{ propertyId: string }>; searchParams: Promise<{ unit?: string }>;
}) {
  const { propertyId } = await params;
  const { unit } = await searchParams;
  const target = unit && UUID.test(unit) ? { kind: "property_unit_id" as const, id: unit } : { kind: "property_id" as const, id: propertyId };
  if (!UUID.test(target.id)) return <p role="status" data-testid="pi-bad-id" className="p-4">Identificador no válido.</p>;
  return <PropertyIntelScreen target={target} />;
}
