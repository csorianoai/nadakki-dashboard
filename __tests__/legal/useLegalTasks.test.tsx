/** @jest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import { useLegalTasks } from "@/hooks/useLegalTasks";
import { TASK_FIXTURES } from "@/lib/legal/task-fixtures";

const getTasks = jest.fn().mockResolvedValue({ tasks: [TASK_FIXTURES[0]] });

jest.mock("@/lib/api/legal", () => ({
  legalApiClient: {
    getTasks: (...args: unknown[]) => getTasks(...args),
  },
}));

jest.mock("@/hooks/useLegalCore", () => ({
  useLegalEffectiveTenantId: () => ({
    effectiveTenantId: "tenant-test",
    tenantHydrated: true,
    tenantError: null,
  }),
}));

describe("useLegalTasks", () => {
  beforeEach(() => {
    getTasks.mockClear();
  });

  it("calls legalApiClient.getTasks with tenant and jurisdiction", async () => {
    const { result } = renderHook(() => useLegalTasks("do"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getTasks).toHaveBeenCalledWith("tenant-test", "do");
  });
});
