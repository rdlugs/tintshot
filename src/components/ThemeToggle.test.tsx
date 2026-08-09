import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle.tsx";

describe("ThemeToggle", () => {
  it("marks only the active mode as pressed", () => {
    render(<ThemeToggle mode="light" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Light theme")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Dark theme")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("System theme")).toHaveAttribute("aria-pressed", "false");
  });

  it("offers system as a choice, not just an unstated default", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeToggle mode="dark" onChange={onChange} />);

    await user.click(screen.getByLabelText("System theme"));

    expect(onChange).toHaveBeenCalledWith("system");
  });

  it("reports the picked mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeToggle mode="system" onChange={onChange} />);

    await user.click(screen.getByLabelText("Dark theme"));

    expect(onChange).toHaveBeenCalledWith("dark");
  });
});
