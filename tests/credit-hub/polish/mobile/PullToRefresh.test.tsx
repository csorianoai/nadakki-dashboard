import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PullToRefresh } from "@/components/credit-hub/system/PullToRefresh";

describe("PullToRefresh", () => {
  test("calls onRefresh after pull threshold", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Content</div>
      </PullToRefresh>
    );

    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    const wrapper = screen.getByText("Content").parentElement?.parentElement as HTMLElement;
    fireEvent.touchStart(wrapper, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientY: 90 }] });
    fireEvent.touchEnd(wrapper);

    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  });
});
