import React from "react";
import { render } from "@testing-library/react-native";
import { LevelBadge } from "../LevelBadge";

describe("LevelBadge", () => {
  it("renders level number", () => {
    const { getByText } = render(<LevelBadge level={5} title="Station Chef" />);
    expect(getByText("5")).toBeTruthy();
  });

  it("renders uppercase title in full mode", () => {
    const { getByText } = render(<LevelBadge level={5} title="Station Chef" />);
    expect(getByText("STATION CHEF")).toBeTruthy();
  });

  it("renders LEVEL subtitle in full mode", () => {
    const { getByText } = render(<LevelBadge level={5} title="Station Chef" />);
    expect(getByText("LEVEL 5")).toBeTruthy();
  });

  describe("compact mode", () => {
    it("renders only the level number", () => {
      const { getByText, queryByText } = render(
        <LevelBadge level={3} title="Line Cook" compact />
      );
      expect(getByText("3")).toBeTruthy();
      // Title and subtitle should not appear in compact mode
      expect(queryByText("LINE COOK")).toBeNull();
      expect(queryByText("LEVEL 3")).toBeNull();
    });
  });

  describe("color thresholds", () => {
    it("renders level 1 (low tier)", () => {
      const { getByText } = render(<LevelBadge level={1} title="Home Cook" />);
      expect(getByText("1")).toBeTruthy();
    });

    it("renders level 4 (mid tier)", () => {
      const { getByText } = render(<LevelBadge level={4} title="Prep Chef" />);
      expect(getByText("4")).toBeTruthy();
    });

    it("renders level 7 (high tier)", () => {
      const { getByText } = render(<LevelBadge level={7} title="Head Chef" />);
      expect(getByText("7")).toBeTruthy();
    });

    it("renders level 10 (max tier)", () => {
      const { getByText } = render(
        <LevelBadge level={10} title="Culinary Legend" />
      );
      expect(getByText("10")).toBeTruthy();
    });
  });
});
