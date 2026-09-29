import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getMusicSettings } from "@/audio/musicSettings";
import { reloadMusicSettingsFromStorage } from "@/test/music-settings";
import { MusicStudio } from "@/components/music/MusicStudio";
import { settle } from "@/test/dom";

describe("Lilt studio", () => {
  beforeEach(() => {
    localStorage.clear();
    reloadMusicSettingsFromStorage();
  });
  afterEach(cleanup);
  async function renderStudio() {
    render(<MusicStudio />);
    await settle();
  }
  test("starts quietly with an accessible player and generated cover", async () => {
    await renderStudio();
    expect(getMusicSettings().enabled).toBe(false);
    expect(screen.getByRole("button", { name: "Play music" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /^Cover of / })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Music position" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Randomize song" }) as HTMLButtonElement).disabled).toBe(false);
  });
  test("opens the melody settings", async () => {
    await renderStudio();
    expect(screen.getByRole("combobox", { name: "Style" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Melody" }));
    expect(screen.getByRole("switch", { name: "Play melody" })).toBeTruthy();
  });
});
