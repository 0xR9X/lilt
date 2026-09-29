import { act, fireEvent } from "@testing-library/react";

/** Base UI measures slider thumbs a microtask after mounting and keeps them hidden until then. */
export const settle = () => act(async () => {});

/** A complete pointer press. Base UI picks select options on release, not on a bare click. */
export function press(element: Element) {
  fireEvent.pointerDown(element);
  fireEvent.mouseDown(element);
  fireEvent.pointerUp(element);
  fireEvent.mouseUp(element);
  fireEvent.click(element);
}
