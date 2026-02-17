"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchSocialStatus,
  getOAuthConnectUrl,
  disconnectPlatform,
} from "@/lib/api/marketing";
import { useToast } from "@/components/ui/Toast";

export type SocialPlatform = {
  platform: string;
  connected: boolean;
  needs_refresh?: boolean;
  page_name?: string;
  user_email?: string;
  [k: string]: unknown;
};

const TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID || "tenant_credicefi";

export type UseSocialConnectionsResult = {
  platforms: SocialPlatform[];
  loading: boolean;
  error: string | null;
  connecting: boolean;
  fetchStatus: (tenantId?: string) => Promise<void>;
  connect: (platform: string, tenantId?: string) => void;
  disconnect: (platform: string, tenantId?: string) => Promise<void>;
};

export function useSocialConnections(): UseSocialConnectionsResult {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const searchParams = useSearchParams();
  const toast = useToast();

  const fetchStatus = useCallback(async (tenantId = TENANT_ID) => {
    setLoading(true);
    setError(null);
    const result = await fetchSocialStatus(tenantId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setPlatforms([]);
      return;
    }
    const data = result.data as Record<string, unknown>;
    let list: SocialPlatform[] = [];
    if (Array.isArray(data?.platforms)) {
      list = data.platforms as SocialPlatform[];
    } else if (Array.isArray(data?.connections)) {
      list = data.connections as SocialPlatform[];
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      // Shape: { meta: { connected, ... }, google: { connected, ... } }
      list = Object.entries(data).map(([platform, info]) => ({
        platform,
        ...(typeof info === "object" && info ? (info as Record<string, unknown>) : {}),
        connected: (info as Record<string, unknown>)?.connected === true,
      }));
    }
    setPlatforms(list);
    setError(null);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Detect ?success= and ?error= URL params
  useEffect(() => {
    const success = searchParams.get("success");
    const errorParam = searchParams.get("error");
    if (success) {
      toast.success("Conexión exitosa", `Plataforma ${success} conectada correctamente.`);
      // Clear URL params without full reload
      window.history.replaceState({}, "", window.location.pathname);
      fetchStatus();
    }
    if (errorParam) {
      toast.error("Error de conexión", errorParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, toast, fetchStatus]);

  const connect = useCallback(
    (platform: string, tenantId = TENANT_ID) => {
      setConnecting(true);
      window.location.href = getOAuthConnectUrl(platform, tenantId);
    },
    []
  );

  const disconnect = useCallback(
    async (platform: string, tenantId = TENANT_ID) => {
      const resp = await disconnectPlatform(platform, tenantId);
      if (resp.ok) {
        toast.success("Desconectado", `${platform} desconectado correctamente.`);
        await fetchStatus(tenantId);
      } else {
        toast.error("Error", `No se pudo desconectar ${platform}.`);
      }
    },
    [toast, fetchStatus]
  );

  return {
    platforms,
    loading,
    error,
    connecting,
    fetchStatus,
    connect,
    disconnect,
  };
}
