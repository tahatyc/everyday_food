import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { router } from "expo-router";
import { Linking } from "react-native";

export function useSubscription() {
  const subscriptionData = useQuery(api.payments.getSubscriptionStatus);
  const createCheckoutAction = useAction(api.payments.createCheckout);
  const createPortalAction = useAction(api.payments.createCustomerPortal);

  const status = subscriptionData?.status ?? "free";
  const isPro = status === "pro" || status === "trialing";
  const isTrialing = status === "trialing";

  const daysLeftInTrial =
    isTrialing && subscriptionData?.trialEnd
      ? Math.max(
          0,
          Math.ceil(
            (subscriptionData.trialEnd - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

  const openPaywall = () => {
    router.push("/paywall" as any);
  };

  const openBilling = async () => {
    try {
      const result = await createPortalAction();
      if (result.portalUrl) {
        await Linking.openURL(result.portalUrl);
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
  };

  const startCheckout = async () => {
    try {
      const result = await createCheckoutAction();
      if (result.checkoutUrl) {
        await Linking.openURL(result.checkoutUrl);
      }
      return result;
    } catch (error) {
      console.error("Failed to create checkout:", error);
      throw error;
    }
  };

  return {
    status,
    isPro,
    isTrialing,
    daysLeftInTrial,
    cancelAtPeriodEnd: subscriptionData?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscriptionData?.currentPeriodEnd ?? null,
    plan: subscriptionData?.plan ?? null,
    isLoading: subscriptionData === undefined,
    openPaywall,
    openBilling,
    startCheckout,
  };
}
