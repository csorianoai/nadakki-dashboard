/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { AppHealthScore } from "@/components/credit/AppHealthScore";
import { calculateApplicationHealthScore } from "@/lib/credit/app-health-score";

jest.mock("framer-motion", () => ({
  useReducedMotion: () => false,
}));

const baseProps = {
  applicationId: "app-1",
  tenantId: "tenant-1",
  applicationData: {},
};

describe("AppHealthScore", () => {
  test("renders gauge (meter)", () => {
    render(
      <AppHealthScore {...baseProps} applicationData={{ credit_score: 620, employment_years: 2 }} />
    );
    expect(screen.getByTestId("app-health-score-root")).toBeInTheDocument();
    expect(screen.getByRole("meter")).toBeInTheDocument();
    expect(screen.getByTestId("app-health-gauge-fill")).toBeInTheDocument();
  });

  test("calculates excellent score above 80 for strong profile", () => {
    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{
          credit_score: 760,
          dti_ratio: 10,
          ltv_ratio: 40,
          employment_years: 5,
          documents_provided: 3,
          documents_required: 3,
        }}
      />
    );
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "83");
    expect(screen.getByTestId("app-health-zone")).toHaveAttribute("data-zone", "excellent");
  });

  test("calculates poor score below 40 for weak profile", () => {
    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{
          credit_score: 320,
          dti_ratio: 50,
          ltv_ratio: 100,
          employment_years: 0,
          documents_provided: 0,
          documents_required: 3,
        }}
      />
    );
    const value = Number(screen.getByRole("meter").getAttribute("aria-valuenow"));
    expect(value).toBeLessThan(40);
    expect(screen.getByTestId("app-health-zone")).toHaveAttribute("data-zone", "poor");
  });

  test("credit factor 35% weight (isolated)", () => {
    expect(calculateApplicationHealthScore({ credit_score: 850 })).toBe(35);
  });

  test("dti factor 25% weight (isolated)", () => {
    expect(calculateApplicationHealthScore({ dti_ratio: 0 })).toBe(25);
    expect(calculateApplicationHealthScore({ dti_ratio: 50 })).toBe(0);
  });

  test("ltv factor 20% weight (isolated)", () => {
    expect(calculateApplicationHealthScore({ ltv_ratio: 0 })).toBe(20);
    expect(calculateApplicationHealthScore({ ltv_ratio: 100 })).toBe(0);
  });

  test("employment factor 10% weight (isolated)", () => {
    expect(calculateApplicationHealthScore({ employment_years: 5 })).toBe(10);
    expect(calculateApplicationHealthScore({ employment_years: 2.5 })).toBe(5);
  });

  test("documents factor 10% weight (isolated)", () => {
    expect(calculateApplicationHealthScore({ documents_provided: 3, documents_required: 3 })).toBe(10);
    expect(calculateApplicationHealthScore({ documents_provided: 1, documents_required: 2 })).toBe(5);
  });

  test("suggestions appear when remediation is warranted", () => {
    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{
          credit_score: 620,
          documents_provided: 1,
          documents_required: 3,
          dti_ratio: 42,
          employment_years: 1,
        }}
      />
    );
    const list = screen.getByTestId("app-health-suggestions");
    expect(list.textContent?.toLowerCase()).toMatch(/co-signer/);
    expect(list.textContent?.toLowerCase()).toMatch(/missing documents|down payment|employment|paystub/);
  });

  test("color zones match numeric score thresholds", () => {
    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{
          credit_score: 690,
          dti_ratio: 18,
          ltv_ratio: 55,
          employment_years: 4,
          documents_provided: 3,
          documents_required: 3,
        }}
      />
    );
    expect(screen.getByTestId("app-health-zone")).toHaveAttribute("data-zone", "good");

    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{
          credit_score: 650,
          dti_ratio: 30,
          ltv_ratio: 75,
          employment_years: 2,
          documents_provided: 2,
          documents_required: 3,
        }}
      />
    );
    expect(screen.getAllByTestId("app-health-zone").slice(-1)[0]).toHaveAttribute("data-zone", "fair");
  });

  test("animated gauge fill uses relaxed motion-safe transition easing", () => {
    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{ credit_score: 740, employment_years: 3 }}
      />
    );
    const fill = screen.getByTestId("app-health-gauge-fill");
    expect(fill.className).toContain("motion-safe:transition-[width]");
    expect(fill.className).toContain("duration-500");
  });

  test("mobile-responsive padding at narrow viewport reference", () => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));
    render(<AppHealthScore {...baseProps} applicationData={{ credit_score: 700 }} />);
    expect(screen.getByTestId("app-health-score-root").className).toMatch(/\bp-4\b/);
  });

  test("meter exposes range and aligns aria-valuenow with valuetext", () => {
    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{ credit_score: 690, employment_years: 3 }}
      />
    );
    const meter = screen.getByRole("meter");
    const now = meter.getAttribute("aria-valuenow");
    expect(meter.getAttribute("aria-valuemin")).toBe("0");
    expect(meter.getAttribute("aria-valuemax")).toBe("100");
    expect(now).not.toBeNull();
    expect(meter.getAttribute("aria-valuetext")).toContain(String(now));
    expect(meter.hasAttribute("aria-labelledby")).toBe(true);
    expect(screen.getByRole("heading", { level: 2 }).id).toBe(
      meter.getAttribute("aria-labelledby")
    );
  });

  test("meter labelledby resolves to readable title", () => {
    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{ credit_score: 745, employment_years: 3 }}
      />
    );
    const meter = screen.getByRole("meter");
    const labelId = meter.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2 }).id).toBe(labelId);
    expect(screen.getByRole("heading", { level: 2 })).toHaveAccessibleName(/Indicador de salud/);
  });

  test("simulator inputs propagate patches for near real-time recalculation", () => {
    const onPatch = jest.fn();

    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{
          credit_score: 760,
          dti_ratio: 10,
          ltv_ratio: 40,
          employment_years: 5,
          documents_provided: 3,
          documents_required: 3,
        }}
        onApplicationDataPatch={onPatch}
      />
    );

    const dtiInput = screen.getByLabelText(/DTI/i);
    fireEvent.change(dtiInput, { target: { value: "48" } });

    expect(onPatch).toHaveBeenCalled();
    const last = onPatch.mock.calls.at(-1)?.[0] as Record<string, number>;
    expect(last.dti_ratio).toBe(48);
  });

  test("tracks medium-score band semantics", () => {
    render(
      <AppHealthScore
        {...baseProps}
        applicationData={{
          credit_score: 720,
          dti_ratio: 25,
          ltv_ratio: 45,
          employment_years: 3,
          documents_provided: 3,
          documents_required: 3,
        }}
      />
    );
    expect(Number(screen.getByRole("meter").getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(62);
    expect(screen.getByTestId("app-health-zone")).toHaveAttribute("data-zone", "good");
  });
});
