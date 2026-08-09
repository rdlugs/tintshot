import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OVERSIZED_WARNING, scaleCapNotice } from "./components/inspector/ExportPanel.tsx";
import { renderApp, screenshotFile, stubImageDecoding } from "./test/helpers.tsx";

/** Pick a screenshot through the file input and wait for the editor to open. */
async function loadScreenshot(user: ReturnType<typeof userEvent.setup>, file = screenshotFile()) {
  await user.upload(screen.getByLabelText("Screenshot file"), file);
  await waitFor(() => expect(screen.getByLabelText("Editing controls")).toBeInTheDocument());
}

describe("App", () => {
  beforeEach(() => stubImageDecoding(1200, 800));

  it("keeps the GitHub repository link available while editing", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByRole("link", { name: "View Tintshot on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/rdlugs/tintshot",
    );
    expect(screen.getByRole("link", { name: "View Tintshot on GitHub" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "View Tintshot on GitHub" })).toHaveAttribute(
      "rel",
      "noreferrer",
    );

    await loadScreenshot(user);

    expect(screen.getByRole("link", { name: "View Tintshot on GitHub" })).toBeInTheDocument();
  });

  it("swaps the welcome screen for the editor once an image loads", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByRole("button", { name: "Choose or drop a screenshot" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Editing controls")).not.toBeInTheDocument();

    await loadScreenshot(user, screenshotFile("hero.png"));

    expect(screen.getByText("hero.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New image" })).toBeInTheDocument();
  });

  it("returns to the welcome screen from New image and resets transparency on the next image", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    await user.click(screen.getByRole("checkbox", { name: "Remove background color" }));
    await user.click(screen.getByRole("button", { name: "New image" }));

    expect(screen.queryByLabelText("Editing controls")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose or drop a screenshot" })).toBeInTheDocument();

    await loadScreenshot(user, screenshotFile("second.png"));

    expect(screen.getByRole("checkbox", { name: "Remove background color" })).not.toBeChecked();
  });

  it("rejects a non-image file without opening the editor", async () => {
    renderApp();

    // Bypass user-event's `accept` filtering — the point is the app's own guard.
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [new File(["notes"], "notes.txt", { type: "text/plain" })] },
    });

    expect(await screen.findByText("Choose an image file to continue")).toBeInTheDocument();
    expect(screen.queryByLabelText("Editing controls")).not.toBeInTheDocument();
  });

  it("marks the chosen canvas ratio and clears the crop", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    // Range inputs are not draggable in jsdom, so drive the change directly.
    fireEvent.change(screen.getByLabelText("Zoom"), { target: { value: "2" } });
    expect(screen.getByLabelText("Zoom")).toHaveValue("2");

    await user.click(screen.getByRole("button", { name: "1:1" }));

    expect(screen.getByRole("button", { name: "1:1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Original" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByLabelText("Zoom")).toHaveValue("1");
  });

  it("shows frame fields only for the frame that owns them", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    expect(screen.queryByLabelText("Browser URL")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Browser" }));
    expect(screen.getByLabelText("Browser URL")).toHaveValue("example.com");
    expect(screen.queryByLabelText("Window title")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Window" }));
    expect(screen.getByLabelText("Window title")).toHaveValue("Screenshot");
    expect(screen.queryByLabelText("Browser URL")).not.toBeInTheDocument();
  });

  it("reports the export size and keeps every scale available for a small image", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    // 1200x800 at 14% padding is a 1424x1024 canvas; the default scale is 2x.
    expect(screen.getAllByText("2,848 × 2,048 px")).toHaveLength(2);
    for (const scale of ["1×", "2×", "3×"]) {
      expect(screen.getByRole("button", { name: scale })).toBeEnabled();
    }
    expect(screen.queryByText(OVERSIZED_WARNING)).not.toBeInTheDocument();
  });

  it("falls back to the largest safe scale for an oversized image", async () => {
    // A 3560x2560 canvas fits the 32 MP budget once, but not at 2x or 3x.
    stubImageDecoding(3000, 2000);
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    expect(screen.getByRole("button", { name: "1×" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "1×" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "2×" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "3×" })).toBeDisabled();
    expect(screen.getByText(scaleCapNotice(1))).toBeInTheDocument();
    expect(screen.queryByText(OVERSIZED_WARNING)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PNG/ })).toBeEnabled();
  });

  it("warns without a fallback when even a 1x export is too large", async () => {
    // 7000x7000 pads out to a 8960x8960 canvas: past the 8192 px edge at every scale.
    stubImageDecoding(7000, 7000);
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    for (const scale of ["1×", "2×", "3×"]) {
      expect(screen.getByRole("button", { name: scale })).toBeDisabled();
    }
    expect(screen.getByText(OVERSIZED_WARNING)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PNG/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Copy/ })).toBeDisabled();
  });

  it("switches image placement between fit and fill", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Fill" }));

    expect(screen.getByRole("button", { name: "Fill" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute("aria-pressed", "false");

    // The choice survives a frame change, which only clears the crop.
    await user.click(screen.getByRole("button", { name: "Phone" }));

    expect(screen.getByRole("button", { name: "Fill" })).toHaveAttribute("aria-pressed", "true");
  });

  it("applies a gradient preset to both colour readouts", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    await user.click(screen.getByRole("button", { name: "Use Ember gradient" }));

    expect(screen.getByLabelText("Gradient start color")).toHaveValue("#f0975a");
    expect(screen.getByText("#F0975A")).toBeInTheDocument();
    expect(screen.getByText("#A92F67")).toBeInTheDocument();
  });

  it("removes and restores the selected background gradient", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    await user.click(screen.getByRole("button", { name: "Use Ember gradient" }));
    const transparentToggle = screen.getByRole("checkbox", { name: "Remove background color" });

    expect(transparentToggle).not.toBeChecked();
    expect(
      screen.getByLabelText("Image preview. Drag or use arrow keys to reposition the crop."),
    ).toHaveClass("transparency-checkerboard");

    await user.click(transparentToggle);

    expect(transparentToggle).toBeChecked();
    expect(screen.getByRole("button", { name: "Use Ember gradient" })).toBeDisabled();
    expect(screen.getByLabelText("Gradient start color")).toBeDisabled();
    expect(screen.getByRole("slider", { name: "Gradient angle" })).toBeDisabled();

    await user.click(transparentToggle);

    expect(transparentToggle).not.toBeChecked();
    expect(screen.getByLabelText("Gradient start color")).toHaveValue("#f0975a");
    expect(screen.getByLabelText("Gradient end color")).toHaveValue("#a92f67");
  });

  it("edits and resets the accessible 3D tilt and shadow controls", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    const tiltX = screen.getByRole("slider", { name: "Tilt X" });
    const panelZoom = screen.getByRole("slider", { name: "3D Zoom" });
    const perspective = screen.getByRole("slider", { name: "Perspective" });
    const followTilt = screen.getByRole("checkbox", { name: "Follow tilt" });

    expect(tiltX).toHaveAttribute("aria-valuetext", "0°");
    expect(panelZoom).toHaveAttribute("aria-valuetext", "100%");
    expect(perspective).toHaveAttribute("aria-valuetext", "65%");
    expect(followTilt).toBeChecked();
    expect(screen.getByLabelText("Shadow color")).toHaveValue("#000000");

    fireEvent.change(tiltX, { target: { value: "24" } });
    fireEvent.change(panelZoom, { target: { value: "1.65" } });
    fireEvent.change(perspective, { target: { value: "0.9" } });
    fireEvent.change(screen.getByRole("slider", { name: "Distance" }), {
      target: { value: "42" },
    });
    fireEvent.change(screen.getByLabelText("Shadow color"), { target: { value: "#345678" } });
    await user.click(followTilt);

    expect(tiltX).toHaveValue("24");
    expect(tiltX).toHaveAttribute("aria-valuetext", "24°");
    expect(panelZoom).toHaveValue("1.65");
    expect(panelZoom).toHaveAttribute("aria-valuetext", "165%");
    expect(perspective).toHaveAttribute("aria-valuetext", "90%");
    expect(followTilt).not.toBeChecked();
    expect(screen.getByLabelText("Shadow color")).toHaveValue("#345678");

    await user.click(screen.getByRole("button", { name: "Reset 3D tilt and shadow" }));

    expect(tiltX).toHaveValue("0");
    expect(panelZoom).toHaveValue("1");
    expect(perspective).toHaveValue("0.65");
    expect(screen.getByRole("slider", { name: "Distance" })).toHaveValue("11");
    expect(followTilt).toBeChecked();
    expect(screen.getByLabelText("Shadow color")).toHaveValue("#000000");
  });

  it("restores the defaults from Reset all settings", async () => {
    const user = userEvent.setup();
    renderApp();
    await loadScreenshot(user);

    await user.click(screen.getByRole("button", { name: "Phone" }));
    await user.click(screen.getByRole("button", { name: "16:9" }));
    await user.click(screen.getByRole("checkbox", { name: "Remove background color" }));
    await user.click(screen.getByRole("button", { name: "Reset all settings" }));

    expect(screen.getByRole("button", { name: "None" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Original" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "Remove background color" })).not.toBeChecked();
    expect(await screen.findByText("Editor settings reset")).toBeInTheDocument();
  });
});
