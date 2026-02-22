"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

export interface SocialConnection {
  id: string;
  platform: string;
  connected: boolean;
  account?: string;
  accountId?: string;
  followers?: number;
  lastSync?: string;
  accessToken?: string;
}

export const useSocialConnect = () => {
  const { tenantId } = useTenant();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/social/connections?tenant_id=${encodeURIComponent(tenantId)}`, {
        headers: { "X-Tenant-ID": tenantId },
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) fetchConnections();
    else setLoading(false);
  }, [tenantId]);

  const getOAuthUrl = (platform: string) => {
    if (!tenantId) return "";
    const redirectUri = encodeURIComponent(window.location.origin + "/social/connections/callback");
    return `${API_URL}/api/social/${platform}/connect?tenant_id=${encodeURIComponent(tenantId)}&redirect_uri=${redirectUri}`;
  };

  const connect = (platform: string) => {
    const url = getOAuthUrl(platform);
    window.location.href = url;
  };

  const disconnect = async (platform: string) => {
    try {
      const res = await fetch(`${API_URL}/api/social/${platform}/disconnect?tenant_id=${encodeURIComponent(tenantId!)}`, {
        method: "POST",
        headers: { "X-Tenant-ID": tenantId },
      });
      if (res.ok) {
        await fetchConnections();
        return true;
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
    return false;
  };

  const reconnect = async (platform: string) => {
    await disconnect(platform);
    connect(platform);
  };

  return {
    connections,
    loading,
    error,
    connect,
    disconnect,
    reconnect,
    refresh: fetchConnections
  };
};

