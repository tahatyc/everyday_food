import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import PaywallScreen from "../paywall";

// Mock useSubscription
const mockStartCheckout = jest.fn();
const mockOpenPaywall = jest.fn();
jest.mock("../../src/hooks/useSubscription", () => ({
  useSubscription: jest.fn(() => ({
    startCheckout: mockStartCheckout,
    isPro: false,
    status: "free",
    openPaywall: mockOpenPaywall,
  })),
}));

const { useSubscription } = require("../../src/hooks/useSubscription");

beforeEach(() => {
  jest.clearAllMocks();
  (useSubscription as jest.Mock).mockReturnValue({
    startCheckout: mockStartCheckout,
    isPro: false,
    status: "free",
    openPaywall: mockOpenPaywall,
  });
});

describe("PaywallScreen", () => {
  it("renders the paywall title", () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText("EVERYDAY FOOD PRO")).toBeTruthy();
  });

  it("renders all 8 feature items", () => {
    const { getByText } = render(<PaywallScreen />);

    expect(getByText("Unlimited recipes")).toBeTruthy();
    expect(getByText("Unlimited meal planning")).toBeTruthy();
    expect(getByText("Unlimited recipe imports")).toBeTruthy();
    expect(getByText("Unlimited shopping lists")).toBeTruthy();
    expect(getByText("Unlimited recipe sharing")).toBeTruthy();
    expect(getByText("Detailed nutrition breakdown")).toBeTruthy();
    expect(getByText("Exclusive achievements")).toBeTruthy();
    expect(getByText("Ad-free experience")).toBeTruthy();
  });

  it("renders CTA button with trial text", () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText("START 7-DAY FREE TRIAL")).toBeTruthy();
  });

  it("renders price text", () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText("Then EUR 8/month")).toBeTruthy();
  });

  it("renders cancel anytime footer", () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText("Cancel anytime")).toBeTruthy();
  });

  it("renders subtitle", () => {
    const { getByText } = render(<PaywallScreen />);
    expect(getByText("Unlock the full cooking experience")).toBeTruthy();
  });

  it("calls startCheckout when CTA is pressed", async () => {
    mockStartCheckout.mockResolvedValue({
      checkoutUrl: "https://checkout.creem.io/test",
      checkoutId: "test",
    });

    const { getByText } = render(<PaywallScreen />);

    fireEvent.press(getByText("START 7-DAY FREE TRIAL"));

    await waitFor(() => {
      expect(mockStartCheckout).toHaveBeenCalledTimes(1);
    });
  });

  it("shows already-pro screen when user is pro", () => {
    (useSubscription as jest.Mock).mockReturnValue({
      startCheckout: mockStartCheckout,
      isPro: true,
      status: "pro",
      openPaywall: mockOpenPaywall,
    });

    const { getByText } = render(<PaywallScreen />);

    expect(getByText("YOU'RE ALREADY PRO!")).toBeTruthy();
    expect(getByText("Enjoying all premium features")).toBeTruthy();
    expect(getByText("CONTINUE COOKING")).toBeTruthy();
  });

  it("shows trial message for trialing users on already-pro screen", () => {
    (useSubscription as jest.Mock).mockReturnValue({
      startCheckout: mockStartCheckout,
      isPro: true,
      status: "trialing",
      openPaywall: mockOpenPaywall,
    });

    const { getByText } = render(<PaywallScreen />);

    expect(getByText("YOU'RE ALREADY PRO!")).toBeTruthy();
    expect(getByText("Enjoying your free trial")).toBeTruthy();
  });

  it("navigates back when close button is pressed", () => {
    const { getByTestId } = render(<PaywallScreen />);

    fireEvent.press(getByTestId("icon-close"));
    expect(router.back).toHaveBeenCalled();
  });

  it("navigates back from already-pro screen", () => {
    (useSubscription as jest.Mock).mockReturnValue({
      startCheckout: mockStartCheckout,
      isPro: true,
      status: "pro",
      openPaywall: mockOpenPaywall,
    });

    const { getByText } = render(<PaywallScreen />);

    fireEvent.press(getByText("CONTINUE COOKING"));
    expect(router.back).toHaveBeenCalled();
  });

  it("handles checkout failure gracefully", async () => {
    mockStartCheckout.mockRejectedValue(new Error("Checkout failed"));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { getByText } = render(<PaywallScreen />);

    fireEvent.press(getByText("START 7-DAY FREE TRIAL"));

    await waitFor(() => {
      expect(mockStartCheckout).toHaveBeenCalled();
    });

    // Button should be re-enabled after failure (not stuck in loading)
    await waitFor(() => {
      expect(getByText("START 7-DAY FREE TRIAL")).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });
});
