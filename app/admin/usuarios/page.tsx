"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { decodeJWT } from "@/lib/auth/jwt-decode";
import { tokenStorage } from "@/lib/auth/token-storage";
import { UsuariosAdmin } from "@/components/admin/usuarios/UsuariosAdmin";

const ROLES_ADMIN = new Set(["owner", "admin", "tenant_admin", "platform_admin", "platform_superadmin"]);

export default function AdminUsuariosPage() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const [tid, setTid] = useState<string | null>(null);

  useEffect(() => {
    // Tenant activo = el del token (claim `tid`), nunca un valor elegido por el cliente.
    const token = tokenStorage.getAccessToken();
    setTid((token && decodeJWT(token)?.tid) || null);
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated || !ROLES_ADMIN.has(role) || !tid) return null;
  return (
    <main className="p-6">
      <UsuariosAdmin tenantId={tid} />
    </main>
  );
}
