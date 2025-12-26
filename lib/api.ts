// lib/api.ts - Backend API connection

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://nadakki-ai-suite.onrender.com';

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const api = {
  // Health check
  async health() {
    const res = await fetchWithTimeout(`${API_BASE}/health`);
    return res.json();
  },

  // Get catalog for a core
  async getCatalog(coreId: string) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/catalog/${coreId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`Error fetching catalog for ${coreId}:`, error);
      return null;
    }
  },

  // Get catalog summary
  async getCatalogSummary(coreId: string) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/catalog/${coreId}/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`Error fetching summary for ${coreId}:`, error);
      return null;
    }
  },

  // Get agents list for a core
  async getAgents(coreId: string) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/catalog/${coreId}/agents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`Error fetching agents for ${coreId}:`, error);
      return null;
    }
  },

  // Execute an agent
  async executeAgent(coreId: string, agentId: string, inputData: Record<string, any>) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/agents/${coreId}/${agentId}/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input_data: inputData }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`Error executing agent ${agentId}:`, error);
      throw error;
    }
  },

  // Get dashboard summary
  async getDashboardSummary() {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/dashboard/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return null;
    }
  },
};

export default api;
