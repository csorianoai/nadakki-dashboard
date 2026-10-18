/**
 * PS-6-DEMO-LEADS: /leads, /leads/pipeline y /leads/scoring no tienen endpoint
 * real del tenant; todo literal de demostracion debe renderizarse dentro de un
 * contenedor [data-demo="true"] que lleve el badge DEMO visible.
 */
import React from "react";
import { render } from "@testing-library/react";
import LeadsPage from "@/app/leads/page";
import PipelinePage from "@/app/leads/pipeline/page";
import ScoringPage from "@/app/leads/scoring/page";
import { DEMO_KPIS, DEMO_STAGES, DEMO_LEADS } from "@/lib/leads/demo-data";

jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: any) => <a href={href}>{children}</a> }));
jest.mock("@/components/ui/NavigationBar", () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

function leaves(root: HTMLElement, texts: string[]) {
  const out: HTMLElement[] = [];
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join("").trim();
    if (own && texts.includes(own)) out.push(el);
  });
  return out;
}

function expectAllDemo(container: HTMLElement, texts: string[]) {
  const found = leaves(container, texts);
  expect(found.length).toBeGreaterThan(0);
  for (const el of found) {
    const wrap = el.closest('[data-demo="true"]');
    expect(wrap).not.toBeNull();
    expect(wrap!.querySelector('[data-testid="badge-demo"]')).not.toBeNull();
  }
  const badge = container.querySelector('[data-testid="badge-demo"]');
  expect(badge!.textContent).toMatch(/DEMO/);
}

describe("leads: datos fijos solo con badge DEMO", () => {
  it("/leads", () => {
    const { container } = render(<LeadsPage />);
    expectAllDemo(container, DEMO_KPIS.map((k) => k.value));
  });
  it("/leads/pipeline", () => {
    const { container } = render(<PipelinePage />);
    expectAllDemo(container, DEMO_STAGES.flatMap((s) => [String(s.count), s.value]));
  });
  it("/leads/scoring", () => {
    const { container } = render(<ScoringPage />);
    expectAllDemo(container, DEMO_LEADS.flatMap((l) => [l.name, l.company]));
  });
});
