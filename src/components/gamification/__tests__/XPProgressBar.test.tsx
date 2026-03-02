import React from "react";
import { render } from "@testing-library/react-native";
import { XPProgressBar } from "../XPProgressBar";

describe("XPProgressBar", () => {
  it("renders level label", () => {
    const { getByText } = render(
      <XPProgressBar xpProgress={50} xpForNext={150} level={2} />
    );
    expect(getByText("LEVEL 2")).toBeTruthy();
  });

  it("renders XP progress text", () => {
    const { getByText } = render(
      <XPProgressBar xpProgress={50} xpForNext={150} level={2} />
    );
    expect(getByText("50 / 150 XP")).toBeTruthy();
  });

  it("renders at max level (xpForNext = 0)", () => {
    const { getByText } = render(
      <XPProgressBar xpProgress={0} xpForNext={0} level={10} />
    );
    expect(getByText("LEVEL 10")).toBeTruthy();
    expect(getByText("0 / 0 XP")).toBeTruthy();
  });

  describe("compact mode", () => {
    it("renders compact XP label", () => {
      const { getByText } = render(
        <XPProgressBar xpProgress={75} xpForNext={150} level={3} compact />
      );
      expect(getByText("75/150 XP")).toBeTruthy();
    });

    it("does not render LEVEL label in compact mode", () => {
      const { queryByText } = render(
        <XPProgressBar xpProgress={75} xpForNext={150} level={3} compact />
      );
      expect(queryByText("LEVEL 3")).toBeNull();
    });
  });
});
