import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { AgentRegistryStatHome } from "@/components/agent-registry/AgentRegistryStatHome";

describe("AgentRegistryStatHome", () => {
  it("shows executable agents line and tooltip", () => {
    const { container } = render(
      <AgentRegistryStatHome
        loading={false}
        available
        summary={{
          displayCount: 63,
          countKind: "executable",
          live: 60,
          feature_flagged: 1,
        }}
        tooltip="test-tooltip"
      />
    );
    expect(screen.getByText("63")).toBeInTheDocument();
    expect(screen.getByText(/executable agents/i)).toBeInTheDocument();
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("title")).toBe("test-tooltip");
  });

  it("shows official total subtitle when countKind official", () => {
    render(
      <AgentRegistryStatHome
        loading={false}
        available
        summary={{ displayCount: 200, countKind: "official" }}
        tooltip="t"
      />
    );
    expect(screen.getByText(/official total \(registry\)/i)).toBeInTheDocument();
  });

  it("shows unavailable without fake numbers", () => {
    render(
      <AgentRegistryStatHome
        loading={false}
        available={false}
        summary={null}
        tooltip="Agent Registry unavailable"
      />
    );
    expect(screen.getByText(/Agent Registry unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText("340")).toBeNull();
    expect(screen.queryByText("350")).toBeNull();
    expect(screen.queryByText("224")).toBeNull();
  });

  it("shows spinner while loading", () => {
    render(
      <AgentRegistryStatHome loading available={false} summary={null} tooltip="" />
    );
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });
});
