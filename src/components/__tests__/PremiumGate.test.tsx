import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PremiumGate } from "../PremiumGate";
import { Text } from "react-native";

// Mock the useSubscription hook
const mockOpenPaywall = jest.fn();
jest.mock("../../hooks/useSubscription", () => ({
  useSubscription: jest.fn(() => ({
    isPro: false,
    openPaywall: mockOpenPaywall,
  })),
}));

const { useSubscription } = require("../../hooks/useSubscription");

beforeEach(() => {
  jest.clearAllMocks();
  (useSubscription as jest.Mock).mockReturnValue({
    isPro: false,
    openPaywall: mockOpenPaywall,
  });
});

describe("PremiumGate", () => {
  it("renders children when user is pro", () => {
    (useSubscription as jest.Mock).mockReturnValue({
      isPro: true,
      openPaywall: mockOpenPaywall,
    });

    const { getByText } = render(
      <PremiumGate feature="recipes" current={20} limit={15}>
        <Text>Child Content</Text>
      </PremiumGate>
    );

    expect(getByText("Child Content")).toBeTruthy();
  });

  it("renders children when under limit (free user)", () => {
    const { getByText } = render(
      <PremiumGate feature="recipes" current={10} limit={15}>
        <Text>Child Content</Text>
      </PremiumGate>
    );

    expect(getByText("Child Content")).toBeTruthy();
  });

  it("renders children at 0 usage", () => {
    const { getByText } = render(
      <PremiumGate feature="recipes" current={0} limit={15}>
        <Text>Child Content</Text>
      </PremiumGate>
    );

    expect(getByText("Child Content")).toBeTruthy();
  });

  it("shows upgrade prompt when limit reached", () => {
    const { getByText, queryByText } = render(
      <PremiumGate feature="recipes" current={15} limit={15}>
        <Text>Child Content</Text>
      </PremiumGate>
    );

    expect(queryByText("Child Content")).toBeNull();
    expect(getByText("LIMIT REACHED")).toBeTruthy();
    expect(getByText(/You've used 15\/15 recipes/)).toBeTruthy();
    expect(getByText("UPGRADE TO PRO")).toBeTruthy();
  });

  it("shows upgrade prompt when over limit", () => {
    const { getByText } = render(
      <PremiumGate feature="shopping lists" current={5} limit={1}>
        <Text>Child Content</Text>
      </PremiumGate>
    );

    expect(getByText("LIMIT REACHED")).toBeTruthy();
    expect(getByText(/You've used 5\/1 shopping lists/)).toBeTruthy();
  });

  it("calls openPaywall when upgrade button is pressed", () => {
    const { getByText } = render(
      <PremiumGate feature="recipes" current={15} limit={15}>
        <Text>Child Content</Text>
      </PremiumGate>
    );

    fireEvent.press(getByText("UPGRADE TO PRO"));
    expect(mockOpenPaywall).toHaveBeenCalledTimes(1);
  });

  it("shows correct feature name in description", () => {
    const { getByText } = render(
      <PremiumGate feature="meal plan days" current={3} limit={3}>
        <Text>Child Content</Text>
      </PremiumGate>
    );

    expect(
      getByText(/Upgrade to Pro for unlimited access/)
    ).toBeTruthy();
  });

  it("pro user bypasses limit even when over limit", () => {
    (useSubscription as jest.Mock).mockReturnValue({
      isPro: true,
      openPaywall: mockOpenPaywall,
    });

    const { getByText } = render(
      <PremiumGate feature="recipes" current={100} limit={15}>
        <Text>Child Content</Text>
      </PremiumGate>
    );

    expect(getByText("Child Content")).toBeTruthy();
  });
});
