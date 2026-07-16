"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchVehicles,
  getVehicle,
  createVehicle,
  getSearchFacets,
  decodeVin,
  listLeads,
  createLead,
  transitionLead,
  calculatePayment,
  calculateMaxPrice,
  getAmortization,
  listPlans,
} from "./api";
import type {
  VehicleSearchFilters,
  VehicleCreatePayload,
  LeadCreatePayload,
  FinanceCalculatePayload,
  FinanceInversePayload,
} from "@/types/autos";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const autosKeys = {
  all: ["autos"] as const,
  vehicles: () => [...autosKeys.all, "vehicles"] as const,
  vehicleSearch: (filters: VehicleSearchFilters) =>
    [...autosKeys.vehicles(), "search", filters] as const,
  vehicleDetail: (id: string) =>
    [...autosKeys.vehicles(), "detail", id] as const,
  facets: (q?: string) => [...autosKeys.vehicles(), "facets", q] as const,
  leads: (tenantId: string, dealerId: string) =>
    [...autosKeys.all, "leads", tenantId, dealerId] as const,
  plans: () => [...autosKeys.all, "plans"] as const,
};

// ---------------------------------------------------------------------------
// Vehicle hooks
// ---------------------------------------------------------------------------

export function useVehicleSearch(filters: VehicleSearchFilters) {
  return useQuery({
    queryKey: autosKeys.vehicleSearch(filters),
    queryFn: () => searchVehicles(filters),
    staleTime: 30_000,
  });
}

export function useVehicleDetail(vehicleId: string) {
  return useQuery({
    queryKey: autosKeys.vehicleDetail(vehicleId),
    queryFn: () => getVehicle(vehicleId),
    enabled: !!vehicleId,
  });
}

export function useCreateVehicle(tenantId: string, dealerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VehicleCreatePayload) =>
      createVehicle(tenantId, dealerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: autosKeys.vehicles() });
    },
  });
}

export function useSearchFacets(query?: string) {
  return useQuery({
    queryKey: autosKeys.facets(query),
    queryFn: () => getSearchFacets(query),
    staleTime: 60_000,
  });
}

export function useDecodeVin(vin: string) {
  return useQuery({
    queryKey: [...autosKeys.all, "vin", vin],
    queryFn: () => decodeVin(vin),
    enabled: !!vin && vin.length === 17,
  });
}

// ---------------------------------------------------------------------------
// Lead hooks
// ---------------------------------------------------------------------------

export function useLeads(
  tenantId: string,
  dealerId: string,
  opts?: { status?: string; page?: number },
) {
  return useQuery({
    queryKey: [...autosKeys.leads(tenantId, dealerId), opts],
    queryFn: () => listLeads(tenantId, dealerId, opts),
    enabled: !!tenantId && !!dealerId,
    staleTime: 15_000,
  });
}

export function useCreateLead(tenantId: string, dealerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeadCreatePayload) =>
      createLead(tenantId, dealerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: autosKeys.leads(tenantId, dealerId),
      });
    },
  });
}

export function useTransitionLead(tenantId: string, dealerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      newStatus,
      actor,
      note,
    }: {
      leadId: string;
      newStatus: string;
      actor?: string;
      note?: string;
    }) => transitionLead(tenantId, leadId, newStatus, actor, note),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: autosKeys.leads(tenantId, dealerId),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Finance hooks
// ---------------------------------------------------------------------------

export function useCalculatePayment() {
  return useMutation({
    mutationFn: (payload: FinanceCalculatePayload) =>
      calculatePayment(payload),
  });
}

export function useCalculateMaxPrice() {
  return useMutation({
    mutationFn: (payload: FinanceInversePayload) =>
      calculateMaxPrice(payload),
  });
}

export function useAmortization() {
  return useMutation({
    mutationFn: (payload: FinanceCalculatePayload) =>
      getAmortization(payload),
  });
}

// ---------------------------------------------------------------------------
// Billing hooks
// ---------------------------------------------------------------------------

export function usePlans() {
  return useQuery({
    queryKey: autosKeys.plans(),
    queryFn: listPlans,
    staleTime: 300_000,
  });
}
