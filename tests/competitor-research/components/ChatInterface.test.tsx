import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInterface } from "@/app/competitor-research/components/ChatInterface";
import type { ChatMessageModel } from "@/hooks/useChatConversation";

describe("ChatInterface", () => {
  it("renders messages and sends on button click", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();
    const messages: ChatMessageModel[] = [
      { id: "1", role: "user", content: "hi" },
      { id: "2", role: "assistant", content: "**bold** reply" },
    ];
    render(
      <ChatInterface
        messages={messages}
        sending={false}
        onSend={onSend}
        countryCode="US"
        lang="en"
        onClear={jest.fn()}
      />
    );
    expect(screen.getByText("hi")).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: /chat message/i });
    await user.type(input, "next");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith("next");
  });

  it("shows placeholder when no messages", () => {
    render(
      <ChatInterface
        messages={[]}
        sending={false}
        onSend={jest.fn()}
        countryCode="MX"
        lang="en"
        onClear={jest.fn()}
      />
    );
    expect(screen.getByText(/analyze boatsetter\.com/)).toBeInTheDocument();
  });
});
