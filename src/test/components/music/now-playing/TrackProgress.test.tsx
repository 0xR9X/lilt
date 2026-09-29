import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ seek: vi.fn(), position: 20, runtime: { status: "playing" } }));
vi.mock("@/audio/playback/react", () => ({
  useMusicPosition: () => mocks.position,
  useMusicRuntime: () => mocks.runtime,
  useMusicSessionController: () => ({ seek: mocks.seek }),
}));
import { TrackProgress } from "@/components/music/now-playing/TrackProgress";
import { settle } from "@/test/dom";

const pointer = { pointerId: 1, pointerType: "mouse", clientY: 8 };

describe("player seeking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.position = 20;
    mocks.runtime.status = "playing";
  });
  afterEach(cleanup);

  test("previews a pointer scrub and seeks only when released", async () => {
    const view = render(<TrackProgress duration={100} />);
    await settle();
    const control = view.container.querySelector("[data-base-ui-slider-control]")!;
    fireEvent.pointerDown(control, { ...pointer, button: 0, clientX: 0 });
    fireEvent.pointerMove(document, { ...pointer, buttons: 1, clientX: 100 });
    expect(screen.getByText("1:40", { selector: "span:first-child" })).toBeTruthy();
    expect(mocks.seek).not.toHaveBeenCalled();
    fireEvent.pointerUp(document, { ...pointer, clientX: 100 });
    expect(mocks.seek).toHaveBeenCalledExactlyOnceWith(100);
    expect(screen.getByText("0:20", { selector: "span:first-child" })).toBeTruthy();
  });

  test("seeks as soon as the keyboard or an input change moves the position", async () => {
    render(<TrackProgress duration={100} />);
    await settle();
    const slider = screen.getByRole("slider", { name: "Music position" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(mocks.seek).toHaveBeenLastCalledWith(20.5);
    fireEvent.change(slider, { target: { value: "50" } });
    expect(mocks.seek).toHaveBeenLastCalledWith(50);
  });

  test("disables seeking while paused", async () => {
    mocks.runtime.status = "stopped";
    render(<TrackProgress duration={100} />);
    await settle();
    expect((screen.getByRole("slider", { name: "Music position" }) as HTMLInputElement).disabled).toBe(true);
  });
});
