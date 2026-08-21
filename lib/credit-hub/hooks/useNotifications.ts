"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isChNotificationsEnabled } from "@/lib/env/feature-ch-notifications";
import { CHApiError } from "../api/client";
import { getCreditNotifications, markNotificationRead } from "../api/notificationsClient";
import { useTenant } from "./useTenant";

const POLL_MS = 120_000; // 2min polling interval

export function useNotifications() {
  const enabled = isChNotificationsEnabled();
  const { apiTenantId } = useTenant();
  const queryClient = useQueryClient();
  const queryKey = ["credit-hub", "notifications", apiTenantId ?? ""];
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const query = useQuery({
    queryKey,
    queryFn: () => getCreditNotifications({ tenantId: apiTenantId!, unreadOnly: false }),
    enabled: enabled && !!apiTenantId && isVisible,
    refetchInterval: isVisible ? POLL_MS : false, // Pause when hidden
    staleTime: POLL_MS,
    retry: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead({ tenantId: apiTenantId!, notificationId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const unsupported =
    !enabled ||
    (query.error instanceof CHApiError && (query.error.status === 404 || query.error.status === 501));

  return {
    enabled,
    hidden: unsupported,
    items: unsupported ? [] : (query.data?.items ?? []),
    unreadCount: unsupported ? 0 : (query.data?.unreadCount ?? 0),
    isLoading: query.isLoading,
    error: query.error,
    markAsRead: (id: string) => markReadMutation.mutateAsync(id),
  };
}
