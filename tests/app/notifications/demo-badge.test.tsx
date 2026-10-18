/** PS-6-DEMO-NOTIFICACIONES: los datos fijos de /notifications llevan badge DEMO. */
import React from "react";
import { render, screen, within } from "@testing-library/react";

jest.mock("@/lib/motion-stub", () => {
  const React = require("react");
  const make = (tag: string) =>
    React.forwardRef(({ initial, animate, transition, ...rest }: any, ref: any) =>
      React.createElement(tag, { ref, ...rest }));
  return { motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }) };
});
jest.mock("@/components/ui/NavigationBar", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

import NotificationsPage from "@/app/notifications/page";

describe("Notificaciones › datos de demostración", () => {
  it("muestra un aviso DEMO visible a nivel de página", () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId("notifications-demo-banner")).toHaveTextContent(/DEMO/);
  });

  it("ninguna notificación fija se renderiza sin badge DEMO", () => {
    const { container } = render(<NotificationsPage />);
    const items = container.querySelectorAll("[data-testid='notification-item']");
    expect(items.length).toBeGreaterThan(0);
    items.forEach((el) => {
      expect(within(el as HTMLElement).getByText("DEMO")).toBeInTheDocument();
    });
  });

  it("no consulta la red (no hay endpoint de tenant)", () => {
    const spy = jest.fn(() => Promise.reject(new Error("x")));
    const prev = (global as any).fetch;
    (global as any).fetch = spy;
    render(<NotificationsPage />);
    expect(spy).not.toHaveBeenCalled();
    (global as any).fetch = prev;
  });
});
