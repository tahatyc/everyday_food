import { useQuery, useAction } from "convex/react";
import { router } from "expo-router";
import { Linking } from "react-native";
import { renderHook, act } from "@testing-library/react-native";
import { useSubscription } from "../useSubscription";

// Mock Linking.openURL
jest.spyOn(Linking, "openURL").mockImplementation(() => Promise.resolve(true));

const mockCreateCheckout = jest.fn();
const mockCreatePortal = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateCheckout.mockReset();
  mockCreatePortal.mockReset();
  (useAction as jest.Mock).mockImplementation((actionRef) => {
    // Return appropriate mock based on call order
    return mockCreateCheckout;
  });
  // Default: return mocks in order (checkout, portal)
  let actionCallCount = 0;
  (useAction as jest.Mock).mockImplementation(() => {
    actionCallCount++;
    return actionCallCount % 2 === 1 ? mockCreateCheckout : mockCreatePortal;
  });
});

describe("useSubscription", () => {
  describe("status derivation", () => {
    it('returns "free" status when no subscription data', () => {
      (useQuery as jest.Mock).mockReturnValue(undefined);

      const { result } = renderHook(() => useSubscription());

      expect(result.current.status).toBe("free");
      expect(result.current.isPro).toBe(false);
      expect(result.current.isTrialing).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });

    it('returns "free" status for free users', () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "free",
        plan: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.status).toBe("free");
      expect(result.current.isPro).toBe(false);
      expect(result.current.isTrialing).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("returns isPro=true for pro users", () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "pro",
        plan: "pro",
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.status).toBe("pro");
      expect(result.current.isPro).toBe(true);
      expect(result.current.isTrialing).toBe(false);
    });

    it("returns isPro=true and isTrialing=true for trialing users", () => {
      const trialEnd = Date.now() + 5 * 24 * 60 * 60 * 1000; // 5 days from now
      (useQuery as jest.Mock).mockReturnValue({
        status: "trialing",
        plan: "pro",
        trialEnd,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: trialEnd,
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.status).toBe("trialing");
      expect(result.current.isPro).toBe(true);
      expect(result.current.isTrialing).toBe(true);
    });

    it("calculates daysLeftInTrial correctly", () => {
      const trialEnd = Date.now() + 5 * 24 * 60 * 60 * 1000; // 5 days from now
      (useQuery as jest.Mock).mockReturnValue({
        status: "trialing",
        plan: "pro",
        trialEnd,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: trialEnd,
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.daysLeftInTrial).toBe(5);
    });

    it("returns daysLeftInTrial as 0 when trial has expired", () => {
      const trialEnd = Date.now() - 1000; // In the past
      (useQuery as jest.Mock).mockReturnValue({
        status: "trialing",
        plan: "pro",
        trialEnd,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: trialEnd,
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.daysLeftInTrial).toBe(0);
    });

    it("returns daysLeftInTrial as null for non-trialing users", () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "pro",
        plan: "pro",
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.daysLeftInTrial).toBeNull();
    });

    it("returns cancelAtPeriodEnd from subscription data", () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "pro",
        plan: "pro",
        trialEnd: null,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: Date.now() + 10 * 24 * 60 * 60 * 1000,
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.cancelAtPeriodEnd).toBe(true);
    });

    it("returns isPro=false for past_due status", () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "past_due",
        plan: "pro",
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: Date.now(),
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.isPro).toBe(false);
      expect(result.current.status).toBe("past_due");
    });

    it("returns isPro=false for expired status", () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "expired",
        plan: "pro",
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: Date.now() - 1000,
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.isPro).toBe(false);
      expect(result.current.status).toBe("expired");
    });
  });

  describe("openPaywall", () => {
    it("navigates to /paywall", () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "free",
        plan: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      });

      const { result } = renderHook(() => useSubscription());

      act(() => {
        result.current.openPaywall();
      });

      expect(router.push).toHaveBeenCalledWith("/paywall");
    });
  });

  describe("openBilling", () => {
    it("calls createCustomerPortal and opens URL", async () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "pro",
        plan: "pro",
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });
      mockCreatePortal.mockResolvedValue({
        portalUrl: "https://billing.creem.io/portal/123",
      });

      const { result } = renderHook(() => useSubscription());

      await act(async () => {
        await result.current.openBilling();
      });

      expect(mockCreatePortal).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(
        "https://billing.creem.io/portal/123"
      );
    });

    it("handles portal creation errors gracefully", async () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "pro",
        plan: "pro",
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });
      mockCreatePortal.mockRejectedValue(new Error("API error"));

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useSubscription());

      await act(async () => {
        await result.current.openBilling();
      });

      expect(Linking.openURL).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("startCheckout", () => {
    it("calls createCheckout and opens URL", async () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "free",
        plan: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      });
      mockCreateCheckout.mockResolvedValue({
        checkoutUrl: "https://checkout.creem.io/abc",
        checkoutId: "abc",
      });

      const { result } = renderHook(() => useSubscription());

      let checkoutResult: any;
      await act(async () => {
        checkoutResult = await result.current.startCheckout();
      });

      expect(mockCreateCheckout).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(
        "https://checkout.creem.io/abc"
      );
      expect(checkoutResult).toEqual({
        checkoutUrl: "https://checkout.creem.io/abc",
        checkoutId: "abc",
      });
    });

    it("throws on checkout failure", async () => {
      (useQuery as jest.Mock).mockReturnValue({
        status: "free",
        plan: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      });
      mockCreateCheckout.mockRejectedValue(new Error("Checkout failed"));

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useSubscription());

      await expect(
        act(async () => {
          await result.current.startCheckout();
        })
      ).rejects.toThrow("Checkout failed");

      consoleSpy.mockRestore();
    });
  });
});
