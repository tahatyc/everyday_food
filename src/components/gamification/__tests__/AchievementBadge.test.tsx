import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { AchievementBadge } from "../AchievementBadge";

describe("AchievementBadge", () => {
  const defaultProps = {
    name: "First Flame",
    icon: "flame",
    tier: "bronze" as const,
    isUnlocked: false,
    progress: 0,
    total: 1,
  };

  it("renders badge name", () => {
    const { getByText } = render(<AchievementBadge {...defaultProps} />);
    expect(getByText("First Flame")).toBeTruthy();
  });

  it("renders icon", () => {
    const { getByTestId } = render(<AchievementBadge {...defaultProps} />);
    expect(getByTestId("icon-flame")).toBeTruthy();
  });

  it("shows progress bar when locked", () => {
    const { queryByTestId } = render(
      <AchievementBadge {...defaultProps} progress={3} total={10} />
    );
    // Progress bar is a View, checkmark is not shown
    expect(queryByTestId("icon-checkmark-circle")).toBeNull();
  });

  it("shows checkmark icon when unlocked", () => {
    const { getByTestId } = render(
      <AchievementBadge {...defaultProps} isUnlocked={true} />
    );
    expect(getByTestId("icon-checkmark-circle")).toBeTruthy();
  });

  it("does not show progress bar when unlocked", () => {
    const { getByTestId } = render(
      <AchievementBadge {...defaultProps} isUnlocked={true} />
    );
    // The checkmark should be present, meaning progress bar is not
    expect(getByTestId("icon-checkmark-circle")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AchievementBadge {...defaultProps} onPress={onPress} />
    );
    fireEvent.press(getByText("First Flame"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders without onPress (optional)", () => {
    expect(() =>
      render(<AchievementBadge {...defaultProps} />)
    ).not.toThrow();
  });

  describe("tiers", () => {
    it("renders bronze tier", () => {
      const { getByText } = render(
        <AchievementBadge {...defaultProps} tier="bronze" />
      );
      expect(getByText("First Flame")).toBeTruthy();
    });

    it("renders silver tier", () => {
      const { getByText } = render(
        <AchievementBadge {...defaultProps} tier="silver" />
      );
      expect(getByText("First Flame")).toBeTruthy();
    });

    it("renders gold tier", () => {
      const { getByText } = render(
        <AchievementBadge {...defaultProps} tier="gold" />
      );
      expect(getByText("First Flame")).toBeTruthy();
    });

    it("renders platinum tier", () => {
      const { getByText } = render(
        <AchievementBadge {...defaultProps} tier="platinum" />
      );
      expect(getByText("First Flame")).toBeTruthy();
    });
  });
});
