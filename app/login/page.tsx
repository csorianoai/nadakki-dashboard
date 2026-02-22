"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (success) {
        router.replace("/dashboard");
      } else {
        setError("Credenciales incorrectas");
      }
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "32px",
          background: "rgba(30, 41, 59, 0.6)",
          borderRadius: "16px",
          border: "1px solid rgba(51, 65, 85, 0.6)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>
            NADAKKI
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>Iniciar sesión</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nadakki.com"
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                color: "#f8fafc",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(51, 65, 85, 0.8)",
                borderRadius: "8px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                color: "#f8fafc",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(51, 65, 85, 0.8)",
                borderRadius: "8px",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#fca5a5",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#fff",
              background: loading ? "#64748b" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
          Demo: admin@sfrentals.com / admin@nadakki.com → admin123
        </p>
      </div>
    </div>
  );
}
