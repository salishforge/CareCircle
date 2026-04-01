import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MoodForm } from "@/components/wellness/MoodForm";

describe("MoodForm", () => {
  it("renders all mood emoji buttons", () => {
    render(<MoodForm onSave={vi.fn()} />);

    const emojis = ["😞", "😕", "😐", "🙂", "😊"];
    emojis.forEach((emoji) => {
      expect(screen.getByText(emoji)).toBeInTheDocument();
    });
  });

  it("renders slider labels", () => {
    render(<MoodForm onSave={vi.fn()} />);

    expect(screen.getByText("Energy")).toBeInTheDocument();
    expect(screen.getAllByText("Pain").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Appetite")).toBeInTheDocument();
    expect(screen.getByText("Sleep quality")).toBeInTheDocument();
  });

  it("renders symptom options", () => {
    render(<MoodForm onSave={vi.fn()} />);

    expect(screen.getByText("Nausea")).toBeInTheDocument();
    expect(screen.getByText("Fatigue")).toBeInTheDocument();
    expect(screen.getByText("Headache")).toBeInTheDocument();
  });

  it("renders Save Entry button when no initial values", () => {
    render(<MoodForm onSave={vi.fn()} />);

    expect(screen.getByText("Save Entry")).toBeInTheDocument();
  });

  it("renders Update Entry button when initial values provided", () => {
    render(
      <MoodForm
        initialValues={{
          mood: 4,
          energyLevel: 3,
          painLevel: 2,
          appetite: 4,
          sleepQuality: 3,
          symptoms: [],
          notes: null,
        }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Update Entry")).toBeInTheDocument();
  });

  it("toggles symptom selection", () => {
    render(<MoodForm onSave={vi.fn()} />);

    const nauseaBtn = screen.getByText("Nausea");
    fireEvent.click(nauseaBtn);

    // After click, it should have the selected styling (coral border)
    expect(nauseaBtn.closest("button")).toHaveClass("bg-coral/10");
  });

  it("calls onSave when form is submitted", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<MoodForm onSave={onSave} />);

    const submitBtn = screen.getByText("Save Entry");
    fireEvent.click(submitBtn);

    // onSave should be called with at least mood
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ mood: 3 }) // default mood is 3
    );
  });
});
