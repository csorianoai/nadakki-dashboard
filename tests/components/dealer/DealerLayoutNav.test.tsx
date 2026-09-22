/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import DealerLayout from "@/app/autos/dealer/layout";

jest.mock("next/navigation", () => ({
  usePathname: () => "/autos/dealer",
}));

describe("Dealer layout navigation at 375", () => {
  test("mobile nav includes inventario and conexiones", () => {
    render(
      <DealerLayout>
        <p>child</p>
      </DealerLayout>,
    );
    const mobile = screen.getByTestId("dealer-mobile-nav");
    expect(mobile.querySelector('a[href="/autos/dealer/inventario"]')).not.toBeNull();
    expect(mobile.querySelector('a[href="/autos/dealer/conexiones"]')).not.toBeNull();
  });
});
