import { redirect } from "next/navigation";
import ContableBalancePage from "../page";

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

describe("/contable/balance", () => {
  it("redirige al balance de comprobacion", () => {
    ContableBalancePage();
    expect(redirect).toHaveBeenCalledWith("/contable/balance-comprobacion");
  });
});
