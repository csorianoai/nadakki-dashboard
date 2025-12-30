'use client';

// context/TenantContext.tsx - Global Tenant State Management
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { tenantsAPI, Tenant } from '@/lib/api/tenants';

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  isAdmin: boolean;
  adminKey: string | null;
  setCurrentTenant: (tenant: Tenant) => void;
  setAdminKey: (key: string | null) => void;
  validateAdminKey: (key: string) => Promise<boolean>;
  refreshTenants: () => Promise<Tenant[]>;
  logout: () => void;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null);
  const [adminKey, setAdminKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTenants = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await tenantsAPI.getAll();
      setTenants(data.tenants);
      return data.tenants;
    } catch (error) {
      console.error('Error loading tenants:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const loadedTenants = await refreshTenants();
      
      // Restore admin key from session
      const storedKey = sessionStorage.getItem('nadakki_admin_key');
      if (storedKey) setAdminKeyState(storedKey);
      
      // Restore current tenant from session
      const storedTenantId = sessionStorage.getItem('nadakki_current_tenant');
      if (storedTenantId && loadedTenants.length > 0) {
        const found = loadedTenants.find((t: Tenant) => t.tenant_id === storedTenantId);
        if (found) {
          setCurrentTenantState(found);
          return;
        }
      }
      
      // Default to first active tenant
      if (loadedTenants.length > 0) {
        const defaultTenant = 
          loadedTenants.find((t: Tenant) => t.status === 'active') || loadedTenants[0];
        setCurrentTenantState(defaultTenant);
      }
    };
    
    init();
  }, [refreshTenants]);

  const setCurrentTenant = useCallback((tenant: Tenant) => {
    setCurrentTenantState(tenant);
    sessionStorage.setItem('nadakki_current_tenant', tenant.tenant_id);
  }, []);

  const setAdminKey = useCallback((key: string | null) => {
    setAdminKeyState(key);
    if (key) {
      sessionStorage.setItem('nadakki_admin_key', key);
    } else {
      sessionStorage.removeItem('nadakki_admin_key');
    }
  }, []);

  const validateAdminKey = useCallback(async (key: string): Promise<boolean> => {
    try {
      // Test the key by trying to get tenants with admin header
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://nadakki-ai-suite.onrender.com'}/tenants`,
        { headers: { 'X-Admin-Key': key } }
      );
      
      if (response.ok) {
        setAdminKey(key);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [setAdminKey]);

  const logout = useCallback(() => {
    setAdminKey(null);
  }, [setAdminKey]);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        tenants,
        isLoading,
        isAdmin: !!adminKey,
        adminKey,
        setCurrentTenant,
        setAdminKey,
        validateAdminKey,
        refreshTenants,
        logout,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

export default TenantContext;

