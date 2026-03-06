import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { useAction } from "convex/react";
import PaymentSuccessScreen from "../payment-success";

// Override the useLocalSearchParams mock from jest.setup.js
const mockUseLocalSearchParams = jest.fn(() => ({}));
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useSegments: () => [],
  usePathname: () => "/",
  Link: "Link",
  Redirect: "Redirect",
}));

const mockVerifyCheckout = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAction as jest.Mock).mockReturnValue(mockVerifyCheckout);
  mockUseLocalSearchParams.mockReturnValue({});
  mockVerifyCheckout.mockResolvedValue({ status: "completed" });
});

describe("PaymentSuccessScreen", () => {
  it("renders success title", () => {
    const { getByText } = render(<PaymentSuccessScreen />);
    expect(getByText("WELCOME TO PRO!")).toBeTruthy();
  });

  it("renders success description", () => {
    const { getByText } = render(<PaymentSuccessScreen />);
    expect(
      getByText(
        "You now have unlimited access to all premium features. Happy cooking!"
      )
    ).toBeTruthy();
  });

  it("renders start cooking CTA", () => {
    const { getByText } = render(<PaymentSuccessScreen />);
    expect(getByText("START COOKING")).toBeTruthy();
  });

  it("navigates to home when CTA is pressed", () => {
    const { getByText } = render(<PaymentSuccessScreen />);

    fireEvent.press(getByText("START COOKING"));
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/");
  });

  it("calls verifyCheckout when checkout_id is provided", () => {
    mockUseLocalSearchParams.mockReturnValue({
      checkout_id: "test-checkout-123",
    });

    render(<PaymentSuccessScreen />);

    expect(mockVerifyCheckout).toHaveBeenCalledWith({
      checkoutId: "test-checkout-123",
    });
  });

  it("does not call verifyCheckout when no checkout_id", () => {
    mockUseLocalSearchParams.mockReturnValue({});

    render(<PaymentSuccessScreen />);

    expect(mockVerifyCheckout).not.toHaveBeenCalled();
  });

  it("handles verifyCheckout failure gracefully", () => {
    mockVerifyCheckout.mockRejectedValue(new Error("Verify failed"));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockUseLocalSearchParams.mockReturnValue({
      checkout_id: "test-checkout-123",
    });

    // Should not throw
    const { getByText } = render(<PaymentSuccessScreen />);
    expect(getByText("WELCOME TO PRO!")).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it("renders checkmark icon", () => {
    const { getByTestId } = render(<PaymentSuccessScreen />);
    expect(getByTestId("icon-checkmark-circle")).toBeTruthy();
  });

  it("renders restaurant icon in CTA", () => {
    const { getByTestId } = render(<PaymentSuccessScreen />);
    expect(getByTestId("icon-restaurant")).toBeTruthy();
  });
});
