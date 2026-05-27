/**
 * Proyectos Finanzas hooks — mock-backed (Fase 2 Workstream C).
 * Swap implementations to proyectoFetchUnknown when backend merges.
 */

import * as mock from "@/lib/mocks/finanzas-api";
import type {
  ApprovalBody,
  BudgetSnapshot,
  BudgetVarianceReport,
  CancelOrdenCompraBody,
  CloseDealBody,
  CloseOrdenCompraBody,
  ConfirmPagoBody,
  ConvertCotizacionToPOBody,
  Cotizacion,
  CreateCotizacionPayload,
  CreateDealPayload,
  CreateFacturaPayload,
  CreateOrdenCompraPayload,
  CreatePagoPayload,
  Deal,
  EconomicEvent,
  Factura,
  FinanzasListFilters,
  FinanceOverview,
  IssueOrdenCompraBody,
  OrdenCompra,
  PaginatedResponse,
  Pago,
  RejectBody,
  ReversePagoBody,
  UpdateBudgetPayload,
  UpdateCotizacionPayload,
  UpdateDealPayload,
  UpdateFacturaPayload,
  UpdateOrdenCompraPayload,
  UpdatePagoPayload,
} from "@/types/finanzas";

export async function getFinanceOverview(tenantId: string, projectId: string): Promise<FinanceOverview> {
  return mock.mockGetFinanceOverview(tenantId, projectId);
}

export async function getBudget(tenantId: string, projectId: string): Promise<BudgetSnapshot> {
  return mock.mockGetBudget(tenantId, projectId);
}

export async function getBudgetVariance(tenantId: string, projectId: string): Promise<BudgetVarianceReport> {
  return mock.mockGetBudgetVariance(tenantId, projectId);
}

export async function updateBudget(
  tenantId: string,
  projectId: string,
  payload: UpdateBudgetPayload,
): Promise<BudgetSnapshot> {
  return mock.mockUpdateBudget(tenantId, projectId, payload);
}

export async function listFacturas(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Factura>> {
  return mock.mockListFacturas(tenantId, projectId, filters);
}

export async function getFactura(tenantId: string, facturaId: string): Promise<Factura | null> {
  return mock.mockGetFactura(tenantId, facturaId);
}

export async function createFactura(
  tenantId: string,
  projectId: string,
  payload: CreateFacturaPayload,
): Promise<Factura> {
  return mock.mockCreateFactura(tenantId, projectId, payload);
}

export async function updateFactura(
  tenantId: string,
  facturaId: string,
  payload: UpdateFacturaPayload,
): Promise<Factura> {
  return mock.mockUpdateFactura(tenantId, facturaId, payload);
}

export async function approveFactura(
  tenantId: string,
  facturaId: string,
  body: ApprovalBody,
): Promise<Factura> {
  return mock.mockApproveFactura(tenantId, facturaId, body);
}

export async function rejectFactura(
  tenantId: string,
  facturaId: string,
  body: RejectBody,
): Promise<Factura> {
  return mock.mockRejectFactura(tenantId, facturaId, body);
}

export async function deleteFactura(tenantId: string, facturaId: string): Promise<void> {
  return mock.mockDeleteFactura(tenantId, facturaId);
}

export async function listCotizaciones(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Cotizacion>> {
  return mock.mockListCotizaciones(tenantId, projectId, filters);
}

export async function getCotizacion(tenantId: string, cotizacionId: string): Promise<Cotizacion | null> {
  return mock.mockGetCotizacion(tenantId, cotizacionId);
}

export async function createCotizacion(
  tenantId: string,
  projectId: string,
  payload: CreateCotizacionPayload,
): Promise<Cotizacion> {
  return mock.mockCreateCotizacion(tenantId, projectId, payload);
}

export async function updateCotizacion(
  tenantId: string,
  cotizacionId: string,
  payload: UpdateCotizacionPayload,
): Promise<Cotizacion> {
  return mock.mockUpdateCotizacion(tenantId, cotizacionId, payload);
}

export async function approveCotizacion(
  tenantId: string,
  cotizacionId: string,
  body: ApprovalBody,
): Promise<Cotizacion> {
  return mock.mockApproveCotizacion(tenantId, cotizacionId, body);
}

export async function rejectCotizacion(
  tenantId: string,
  cotizacionId: string,
  body: RejectBody,
): Promise<Cotizacion> {
  return mock.mockRejectCotizacion(tenantId, cotizacionId, body);
}

export async function convertCotizacionToPO(
  tenantId: string,
  cotizacionId: string,
  body: ConvertCotizacionToPOBody,
): Promise<OrdenCompra> {
  return mock.mockConvertCotizacionToPO(tenantId, cotizacionId, body);
}

export async function deleteCotizacion(tenantId: string, cotizacionId: string): Promise<void> {
  return mock.mockDeleteCotizacion(tenantId, cotizacionId);
}

export async function listOrdenesCompra(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<OrdenCompra>> {
  return mock.mockListOrdenesCompra(tenantId, projectId, filters);
}

export async function getOrdenCompra(tenantId: string, ocId: string): Promise<OrdenCompra | null> {
  return mock.mockGetOrdenCompra(tenantId, ocId);
}

export async function createOrdenCompra(
  tenantId: string,
  projectId: string,
  payload: CreateOrdenCompraPayload,
): Promise<OrdenCompra> {
  return mock.mockCreateOrdenCompra(tenantId, projectId, payload);
}

export async function updateOrdenCompra(
  tenantId: string,
  ocId: string,
  payload: UpdateOrdenCompraPayload,
): Promise<OrdenCompra> {
  return mock.mockUpdateOrdenCompra(tenantId, ocId, payload);
}

export async function issueOrdenCompra(
  tenantId: string,
  ocId: string,
  body: IssueOrdenCompraBody,
): Promise<OrdenCompra> {
  return mock.mockIssueOrdenCompra(tenantId, ocId, body);
}

export async function cancelOrdenCompra(
  tenantId: string,
  ocId: string,
  body: CancelOrdenCompraBody,
): Promise<OrdenCompra> {
  return mock.mockCancelOrdenCompra(tenantId, ocId, body);
}

export async function closeOrdenCompra(
  tenantId: string,
  ocId: string,
  body: CloseOrdenCompraBody,
): Promise<OrdenCompra> {
  return mock.mockCloseOrdenCompra(tenantId, ocId, body);
}

export async function deleteOrdenCompra(tenantId: string, ocId: string): Promise<void> {
  return mock.mockDeleteOrdenCompra(tenantId, ocId);
}

export async function listPagos(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Pago>> {
  return mock.mockListPagos(tenantId, projectId, filters);
}

export async function getPago(tenantId: string, pagoId: string): Promise<Pago | null> {
  return mock.mockGetPago(tenantId, pagoId);
}

export async function createPago(
  tenantId: string,
  projectId: string,
  payload: CreatePagoPayload,
): Promise<Pago> {
  return mock.mockCreatePago(tenantId, projectId, payload);
}

export async function updatePago(
  tenantId: string,
  pagoId: string,
  payload: UpdatePagoPayload,
): Promise<Pago> {
  return mock.mockUpdatePago(tenantId, pagoId, payload);
}

export async function confirmPago(
  tenantId: string,
  pagoId: string,
  body: ConfirmPagoBody,
): Promise<Pago> {
  return mock.mockConfirmPago(tenantId, pagoId, body);
}

export async function reversePago(
  tenantId: string,
  pagoId: string,
  body: ReversePagoBody,
): Promise<Pago> {
  return mock.mockReversePago(tenantId, pagoId, body);
}

export async function deletePago(tenantId: string, pagoId: string): Promise<void> {
  return mock.mockDeletePago(tenantId, pagoId);
}

export async function listDeals(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<Deal>> {
  return mock.mockListDeals(tenantId, projectId, filters);
}

export async function getDeal(tenantId: string, dealId: string): Promise<Deal | null> {
  return mock.mockGetDeal(tenantId, dealId);
}

export async function createDeal(
  tenantId: string,
  projectId: string,
  payload: CreateDealPayload,
): Promise<Deal> {
  return mock.mockCreateDeal(tenantId, projectId, payload);
}

export async function updateDeal(
  tenantId: string,
  dealId: string,
  payload: UpdateDealPayload,
): Promise<Deal> {
  return mock.mockUpdateDeal(tenantId, dealId, payload);
}

export async function closeDeal(
  tenantId: string,
  dealId: string,
  body: CloseDealBody,
): Promise<Deal> {
  return mock.mockCloseDeal(tenantId, dealId, body);
}

export async function deleteDeal(tenantId: string, dealId: string): Promise<void> {
  return mock.mockDeleteDeal(tenantId, dealId);
}

export async function listEventosEconomicos(
  tenantId: string,
  projectId: string,
  filters?: FinanzasListFilters,
): Promise<PaginatedResponse<EconomicEvent>> {
  return mock.mockListEventosEconomicos(tenantId, projectId, filters);
}

export async function getEventoEconomico(
  tenantId: string,
  eventoId: string,
): Promise<EconomicEvent | null> {
  return mock.mockGetEventoEconomico(tenantId, eventoId);
}
