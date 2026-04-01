import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInput } from "@/components/chat/ChatInput";

describe("ChatInput", () => {
  it("renders input and send button", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);

    expect(screen.getByPlaceholderText("Ask about your care...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("disables send button when input is empty", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("enables send button when input has text", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);

    const textarea = screen.getByPlaceholderText("Ask about your care...");
    fireEvent.change(textarea, { target: { value: "Hello" } });

    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("calls onSend with trimmed text on submit", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);

    const textarea = screen.getByPlaceholderText("Ask about your care...");
    fireEvent.change(textarea, { target: { value: "  Hello world  " } });
    fireEvent.submit(textarea.closest("form")!);

    expect(onSend).toHaveBeenCalledWith("Hello world");
  });

  it("clears input after send", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);

    const textarea = screen.getByPlaceholderText("Ask about your care...") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.submit(textarea.closest("form")!);

    expect(textarea.value).toBe("");
  });

  it("disables input and button when loading", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={true} />);

    expect(screen.getByPlaceholderText("Ask about your care...")).toBeDisabled();
  });

  it("does not send empty messages", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);

    const textarea = screen.getByPlaceholderText("Ask about your care...");
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.submit(textarea.closest("form")!);

    expect(onSend).not.toHaveBeenCalled();
  });
});
