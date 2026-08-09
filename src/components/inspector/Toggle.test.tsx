import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "./Toggle.tsx";

describe("Toggle", () => {
  // Regression test for issue #19: the checkbox is hidden with `absolute`, so the label must
  // establish a positioning context. Without it the input is laid out against the initial
  // containing block, adds document scroll height, and focusing it scrolls the app out of view.
  it("keeps the hidden checkbox positioned inside its label", () => {
    render(<Toggle label="Follow tilt" checked={false} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Follow tilt").closest("label")).toHaveClass("relative");
  });

  it("reports the new value when clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle label="Follow tilt" checked={false} onChange={onChange} />);

    await user.click(screen.getByLabelText("Follow tilt"));

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
