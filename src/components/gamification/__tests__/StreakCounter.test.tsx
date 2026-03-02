import React from "react";
import { render } from "@testing-library/react-native";
import { StreakCounter } from "../StreakCounter";

describe("StreakCounter", () => {
  it("renders streak count", () => {
    const { getByText } = render(<StreakCounter currentStreak={5} />);
    expect(getByText("5")).toBeTruthy();
  });

  it("renders flame icon", () => {
    const { getByTestId } = render(<StreakCounter currentStreak={5} />);
    expect(getByTestId("icon-flame")).toBeTruthy();
  });

  it("shows 'DAYS' label for streak > 1", () => {
    const { getByText } = render(<StreakCounter currentStreak={5} />);
    expect(getByText("DAYS")).toBeTruthy();
  });

  it("shows 'DAY' label for streak === 1", () => {
    const { getByText } = render(<StreakCounter currentStreak={1} />);
    expect(getByText("DAY")).toBeTruthy();
  });

  it("renders 0 streak (inactive state)", () => {
    const { getByText } = render(<StreakCounter currentStreak={0} />);
    expect(getByText("0")).toBeTruthy();
    expect(getByText("DAYS")).toBeTruthy();
  });

  describe("compact mode", () => {
    it("renders streak count in compact mode", () => {
      const { getByText } = render(
        <StreakCounter currentStreak={7} compact />
      );
      expect(getByText("7")).toBeTruthy();
    });

    it("does not show DAY/DAYS label in compact mode", () => {
      const { queryByText } = render(
        <StreakCounter currentStreak={7} compact />
      );
      expect(queryByText("DAYS")).toBeNull();
      expect(queryByText("DAY")).toBeNull();
    });

    it("renders flame icon in compact mode", () => {
      const { getByTestId } = render(
        <StreakCounter currentStreak={3} compact />
      );
      expect(getByTestId("icon-flame")).toBeTruthy();
    });
  });
});
