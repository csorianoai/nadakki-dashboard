"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTenant } from "@/components/system/TenantProvider";
import {
  addToCompare,
  addVehicleToCart,
  appendAuditEntry,
  cartAuditKey,
  cartCount,
  cartStorageKey,
  clearCart as clearCartState,
  clearCompare,
  compareCount,
  emptyCartState,
  getCompareVehicles,
  parseCartState,
  readAuditLog,
  removeFromCompare,
  removeVehicleFromCart,
  toggleCompareEnabled,
  writeAuditLog,
} from "@/lib/autos-portal/cart-storage";
import {
  buildShareTokenFromState,
  buildShareUrl,
  cartStateFromShare,
  decodeSharePayload,
  isShareExpired,
} from "@/lib/autos-portal/cart-share";
import type { CartState, VehicleCartInput } from "@/lib/autos-portal/cart-types";

type CartContextValue = {
  cart: CartState;
  tenantId: string | null;
  ready: boolean;
  addVehicle: (input: VehicleCartInput) => boolean;
  removeVehicle: (vehicleId: string) => void;
  getCart: () => CartState["vehicles"];
  clearCart: () => void;
  toggleCompare: () => void;
  addToCompare: (vehicleId: string) => void;
  removeFromCompare: (vehicleId: string) => void;
  getCompareVehicles: () => CartState["vehicles"];
  clearCompare: () => void;
  cartCount: () => number;
  compareCount: () => number;
  isInCart: (vehicleId: string) => boolean;
  generateShareUrl: () => string | null;
  loadFromShareUrl: (token: string) => { ok: boolean; error?: string };
  getShareToken: () => string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

function persistCart(tenantId: string, state: CartState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(cartStorageKey(tenantId), JSON.stringify(state));
  } catch {
    /* quota */
  }
}

function loadCart(tenantId: string): CartState {
  if (typeof window === "undefined") return emptyCartState();
  try {
    return parseCartState(sessionStorage.getItem(cartStorageKey(tenantId)));
  } catch {
    return emptyCartState();
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { config } = useTenant();
  const tenantId = config.tenantId;
  const [cart, setCart] = useState<CartState>(emptyCartState);
  const [ready, setReady] = useState(false);

  const audit = useCallback(
    (operation: string, result: "ok" | "error", detail?: string, vehicleId?: string) => {
      if (typeof window === "undefined" || !tenantId) return;
      const prev = readAuditLog(sessionStorage, tenantId);
      const next = appendAuditEntry(prev, {
        operation,
        vehicle_id: vehicleId,
        tenant_id: tenantId,
        timestamp: Date.now(),
        result,
        detail,
      });
      writeAuditLog(sessionStorage, tenantId, next);
    },
    [tenantId],
  );

  const applyState = useCallback(
    (next: CartState) => {
      setCart(next);
      if (tenantId) persistCart(tenantId, next);
    },
    [tenantId],
  );

  useEffect(() => {
    if (!tenantId) {
      setCart(emptyCartState());
      setReady(true);
      return;
    }
    setCart(() => {
      const loaded = loadCart(tenantId);
      return {
        ...loaded,
        vehicles: loaded.vehicles.filter((v) => v.tenant_id === tenantId),
        compare_ids: loaded.compare_ids.filter((id) =>
          loaded.vehicles.some((v) => v.vehicle_id === id && v.tenant_id === tenantId),
        ),
      };
    });
    setReady(true);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId || typeof window === "undefined") return;
    const key = cartStorageKey(tenantId);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === sessionStorage) {
        setCart(parseCartState(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [tenantId]);

  const addVehicle = useCallback(
    (input: VehicleCartInput): boolean => {
      if (!tenantId) {
        audit("add_vehicle", "error", "tenant_unavailable");
        return false;
      }
      if (input.tenant_id !== tenantId) {
        audit("add_vehicle", "error", "tenant_mismatch", input.vehicle_id);
        return false;
      }
      const next = addVehicleToCart(cart, input);
      applyState(next);
      audit("add_vehicle", "ok", undefined, input.vehicle_id);
      return true;
    },
    [applyState, audit, cart, tenantId],
  );

  const removeVehicle = useCallback(
    (vehicleId: string) => {
      const next = removeVehicleFromCart(cart, vehicleId);
      applyState(next);
      audit("remove_vehicle", "ok", undefined, vehicleId);
    },
    [applyState, audit, cart],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      tenantId,
      ready,
      addVehicle,
      removeVehicle,
      getCart: () => cart.vehicles,
      clearCart: () => {
        applyState(clearCartState(cart));
        audit("clear_cart", "ok");
      },
      toggleCompare: () => {
        applyState(toggleCompareEnabled(cart));
        audit("toggle_compare", "ok");
      },
      addToCompare: (vehicleId: string) => {
        applyState(addToCompare(cart, vehicleId));
        audit("add_compare", "ok", undefined, vehicleId);
      },
      removeFromCompare: (vehicleId: string) => {
        applyState(removeFromCompare(cart, vehicleId));
        audit("remove_compare", "ok", undefined, vehicleId);
      },
      getCompareVehicles: () => getCompareVehicles(cart),
      clearCompare: () => {
        applyState(clearCompare(cart));
        audit("clear_compare", "ok");
      },
      cartCount: () => cartCount(cart),
      compareCount: () => compareCount(cart),
      isInCart: (vehicleId: string) => cart.vehicles.some((v) => v.vehicle_id === vehicleId),
      generateShareUrl: () => {
        if (!tenantId) return null;
        const token = buildShareTokenFromState(cart, tenantId);
        if (!token) return null;
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        return buildShareUrl(token, origin);
      },
      getShareToken: () => {
        if (!tenantId) return null;
        return buildShareTokenFromState(cart, tenantId);
      },
      loadFromShareUrl: (token: string) => {
        if (!tenantId) return { ok: false, error: "Tenant no disponible" };
        const payload = decodeSharePayload(token);
        if (!payload) return { ok: false, error: "Enlace inválido" };
        if (payload.tenant_id !== tenantId) {
          audit("load_share", "error", "tenant_mismatch");
          return { ok: false, error: "Este carrito pertenece a otro tenant" };
        }
        if (isShareExpired(payload)) {
          audit("load_share", "error", "expired");
          return { ok: false, error: "Enlace expirado" };
        }
        applyState(cartStateFromShare(payload));
        audit("load_share", "ok");
        return { ok: true };
      },
    }),
    [addVehicle, applyState, audit, cart, ready, removeVehicle, tenantId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartStore(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartStore must be used within CartProvider");
  }
  return ctx;
}

/** Test hook — expose audit key for diagnostics */
export { cartAuditKey };
