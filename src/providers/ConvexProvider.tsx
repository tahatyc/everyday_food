import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { ReactNode } from "react";
import { convexAsyncStorage } from "./convexStorage";

// Initialize Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "EXPO_PUBLIC_CONVEX_URL is not set. Check your .env.local file."
  );
}

const convex = new ConvexReactClient(convexUrl);

interface Props {
  children: ReactNode;
}

export function ConvexProvider({ children }: Props) {
  return (
    <ConvexAuthProvider client={convex} storage={convexAsyncStorage}>
      {children}
    </ConvexAuthProvider>
  );
}

export default ConvexProvider;
