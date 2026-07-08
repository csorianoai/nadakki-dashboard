import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { CHApiError } from "@/lib/credit-hub/api/client";
import { useNotifications } from "@/lib/credit-hub/hooks/useNotifications";

const mockIsEnabled = jest.fn(() => false);
jest.mock("@/lib/env/feature-ch-notifications", () => ({
  isChNotificationsEnabled: () => mockIsEnabled(),
}));

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ apiTenantId: "tenant-1", tenantId: "tenant-1", tenantSlug: "demo", loading: false }),
}));

const mockGetCreditNotifications = jest.fn();
const mockMarkNotificationRead = jest.fn();
jest.mock("@/lib/credit-hub/api/notificationsClient", () => ({
  getCreditNotifications: (...args: unknown[]) => mockGetCreditNotifications(...args),
  markNotificationRead: (...args: unknown[]) => mockMarkNotificationRead(...args),
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEnabled.mockReturnValue(false);
  });

  test("hides bell when feature flag is off", () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.hidden).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.items).toEqual([]);
    expect(mockGetCreditNotifications).not.toHaveBeenCalled();
  });

  test("returns unread count from API when enabled", async () => {
    mockIsEnabled.mockReturnValue(true);
    mockGetCreditNotifications.mockResolvedValue({
      items: [
        { id: "n1", title: "Decisión", read: false },
        { id: "n2", title: "Oferta", read: true },
      ],
      unreadCount: 1,
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.unreadCount).toBe(1));
    expect(result.current.hidden).toBe(false);
    expect(result.current.items).toHaveLength(2);
  });

  test("mark-as-read refetches notifications", async () => {
    mockIsEnabled.mockReturnValue(true);
    mockGetCreditNotifications.mockResolvedValue({
      items: [{ id: "n1", title: "A", read: false }],
      unreadCount: 1,
    });
    mockMarkNotificationRead.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    mockGetCreditNotifications.mockResolvedValue({
      items: [{ id: "n1", title: "A", read: true }],
      unreadCount: 0,
    });
    await result.current.markAsRead("n1");

    await waitFor(() => expect(result.current.unreadCount).toBe(0));
    expect(mockMarkNotificationRead).toHaveBeenCalledWith({ tenantId: "tenant-1", notificationId: "n1" });
  });

  test("hides bell on 404 without crash", async () => {
    mockIsEnabled.mockReturnValue(true);
    mockGetCreditNotifications.mockRejectedValue(new CHApiError("Not found", 404));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.hidden).toBe(true));
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.items).toEqual([]);
  });
});
