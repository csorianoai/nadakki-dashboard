import React from "react";
import { render, screen } from "@testing-library/react";
import { EvidenceGrid } from "@/components/credit-hub/primitives/EvidenceGrid";
import type { IdentityEvidence } from "@/lib/credit-hub/ch-types";

// Mock lucide-react icons to simple spans
jest.mock("lucide-react", () => {
  const React = require("react");
  const icon = (name: string) =>
    React.forwardRef(function MockIcon(props: Record<string, unknown>, ref: React.Ref<SVGSVGElement>) {
      return React.createElement("svg", { ...props, ref, "data-icon": name });
    });
  return {
    DollarSign: icon("DollarSign"),
    FileText: icon("FileText"),
    Fingerprint: icon("Fingerprint"),
    Gauge: icon("Gauge"),
    Shield: icon("Shield"),
    Zap: icon("Zap"),
    Car: icon("Car"),
  };
});

describe("EvidenceGrid", () => {
  it("renders default items when no props passed", () => {
    render(<EvidenceGrid />);
    const grid = screen.getByTestId("evidence-grid");
    expect(grid).toBeInTheDocument();
    // Default has 3 items (no identity hardcode)
    const titles = screen.getAllByTestId("evidence-title");
    expect(titles.length).toBe(3);
  });

  it("renders cedula verified when identity has valid cedula", () => {
    const identity: IdentityEvidence = {
      cedula: { verified: true, document_id: "doc-1", extracted_name: "Jose Pena" },
    };
    render(<EvidenceGrid identity={identity} />);
    const bodies = screen.getAllByTestId("evidence-body");
    const cedulaBody = bodies.find((el) => el.textContent?.includes("Jose Pena"));
    expect(cedulaBody).toBeTruthy();
    expect(cedulaBody?.textContent).toContain("Cedula coincide con Jose Pena");
  });

  it("renders liveness live with green badge (alto confidence)", () => {
    const identity: IdentityEvidence = {
      liveness: {
        status: "live",
        pad_score: 0.95,
        provider: "TRUORA",
        evidence_id: "ev-123",
      },
    };
    render(<EvidenceGrid identity={identity} />);
    const bodies = screen.getAllByTestId("evidence-body");
    const livenessBody = bodies.find((el) => el.textContent?.includes("Persona viva confirmada"));
    expect(livenessBody).toBeTruthy();
    expect(livenessBody?.textContent).toContain("95%");

    // Check alto confidence badge exists for liveness card
    const altoBadges = screen.getAllByTestId("evidence-conf-alto");
    expect(altoBadges.length).toBeGreaterThan(0);
  });

  it("renders liveness spoof with red badge (bajo confidence)", () => {
    const identity: IdentityEvidence = {
      liveness: {
        status: "spoof",
        pad_score: 0.15,
        provider: "MOCK",
        evidence_id: null,
      },
    };
    render(<EvidenceGrid identity={identity} />);
    const bodies = screen.getAllByTestId("evidence-body");
    const spoofBody = bodies.find((el) => el.textContent?.includes("Ataque de presentacion"));
    expect(spoofBody).toBeTruthy();

    // Check bajo confidence badge exists
    const bajoBadges = screen.getAllByTestId("evidence-conf-bajo");
    expect(bajoBadges.length).toBeGreaterThan(0);
  });

  it("renders liveness needs_review with amber badge (medio confidence)", () => {
    const identity: IdentityEvidence = {
      liveness: {
        status: "needs_review",
        pad_score: 0.55,
        provider: "TRUORA",
        evidence_id: "ev-456",
      },
    };
    render(<EvidenceGrid identity={identity} />);
    const bodies = screen.getAllByTestId("evidence-body");
    const reviewBody = bodies.find((el) => el.textContent?.includes("Requiere revision manual"));
    expect(reviewBody).toBeTruthy();
    expect(reviewBody?.textContent).toContain("55%");

    const medioBadges = screen.getAllByTestId("evidence-conf-medio");
    expect(medioBadges.length).toBeGreaterThan(0);
  });

  it("renders face match score", () => {
    const identity: IdentityEvidence = {
      face_match: {
        status: "matched",
        score: 0.92,
        provider: "TRUORA",
      },
    };
    render(<EvidenceGrid identity={identity} />);
    const bodies = screen.getAllByTestId("evidence-body");
    const fmBody = bodies.find((el) => el.textContent?.includes("Coincide"));
    expect(fmBody).toBeTruthy();
    expect(fmBody?.textContent).toContain("92%");
  });

  it("does NOT render INE string (regression)", () => {
    // With no items and no identity
    const { container: c1 } = render(<EvidenceGrid />);
    expect(c1.textContent).not.toContain("INE");

    // With identity
    const { container: c2 } = render(
      <EvidenceGrid
        identity={{
          liveness: { status: "live", pad_score: 0.95, provider: "TRUORA", evidence_id: "ev-1" },
          cedula: { verified: true, document_id: "d-1", extracted_name: "Test" },
        }}
      />,
    );
    expect(c2.textContent).not.toContain("INE");
  });

  it("renders provider and evidence_id when available", () => {
    const identity: IdentityEvidence = {
      liveness: {
        status: "live",
        pad_score: 0.90,
        provider: "TRUORA",
        evidence_id: "ev-audit-789",
      },
    };
    const { container } = render(<EvidenceGrid identity={identity} />);
    expect(container.textContent).toContain("TRUORA");
    expect(container.textContent).toContain("ev-audit-789");
  });

  it("handles null/undefined identity gracefully", () => {
    // undefined identity
    render(<EvidenceGrid identity={undefined} />);
    expect(screen.getByTestId("evidence-grid")).toBeInTheDocument();

    // identity with all null fields
    render(
      <EvidenceGrid
        identity={{
          liveness: null,
          face_match: null,
          cedula: null,
        }}
      />,
    );
    // Should show fallback "pending" card
    const bodies = screen.getAllByTestId("evidence-body");
    const pendingBody = bodies.find((el) =>
      el.textContent?.includes("Verificacion de identidad pendiente"),
    );
    expect(pendingBody).toBeTruthy();
  });

  it("prefers explicit items over identity when items are passed", () => {
    const identity: IdentityEvidence = {
      liveness: { status: "live", pad_score: 0.95, provider: "X", evidence_id: "e-1" },
    };
    render(
      <EvidenceGrid
        items={[{ title: "Custom item", body: "Custom body" }]}
        identity={identity}
      />,
    );
    const titles = screen.getAllByTestId("evidence-title");
    expect(titles.length).toBe(1);
    expect(titles[0].textContent).toBe("Custom item");
  });
});
