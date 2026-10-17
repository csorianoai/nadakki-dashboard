"use client";

export function ProfileSections({
  locale,
  displayName,
  email,
  phone,
  institutionName,
}: {
  locale: string;
  displayName: string;
  email: string;
  phone: string;
  institutionName: string;
}) {
  return (
    <div className="ch-card p-4">
      <h2 className="ch-serif" style={{ margin: 0, fontSize: 17, marginBottom: 14 }}>
        Datos del asesor
      </h2>
      <p style={{ fontSize: 12, color: "var(--ch-text-3)", marginBottom: 16 }}>
        Estos datos son de solo lectura. Para modificarlos, comunícate con el administrador de tu cuenta.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="ch-label" htmlFor="dealer-profile-name">
            Nombre para mostrar
          </label>
          <input
            id="dealer-profile-name"
            className="ch-input"
            style={{ minHeight: 44, width: "100%" }}
            value={displayName}
            readOnly
          />
        </div>
        <div>
          <label className="ch-label" htmlFor="dealer-profile-email">
            Correo
          </label>
          <input id="dealer-profile-email" className="ch-input" style={{ minHeight: 44, width: "100%" }} value={email} readOnly />
        </div>
        <div>
          <label className="ch-label" htmlFor="dealer-profile-phone">
            Teléfono de contacto
          </label>
          <input
            id="dealer-profile-phone"
            className="ch-input"
            style={{ minHeight: 44, width: "100%" }}
            value={phone}
            readOnly
            placeholder={locale.toLowerCase().startsWith("es") ? "Sin registrar" : "Not set"}
          />
        </div>
        <div>
          <label className="ch-label">Concesionario / institución</label>
          <input className="ch-input" style={{ minHeight: 44, width: "100%" }} value={institutionName} readOnly />
        </div>
      </div>
    </div>
  );
}
