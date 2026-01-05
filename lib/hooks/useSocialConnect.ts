import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "credicefi";

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
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL + "/api/social/connections?tenant_id=" + TENANT_ID);
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
    fetchConnections();
  }, []);

  const getOAuthUrl = (platform: string) => {
    const redirectUri = encodeURIComponent(window.location.origin + "/social/connections/callback");
    return API_URL + "/api/social/" + platform + "/connect?tenant_id=" + TENANT_ID + "&redirect_uri=" + redirectUri;
  };

  const connect = (platform: string) => {
    const url = getOAuthUrl(platform);
    window.location.href = url;
  };

  const disconnect = async (platform: string) => {
    try {
      const res = await fetch(API_URL + "/api/social/" + platform + "/disconnect?tenant_id=" + TENANT_ID, {
        method: "POST"
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
