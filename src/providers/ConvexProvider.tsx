import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { ReactNode } from "react";
import { convexAsyncStorage } from "./convexStorage";

// Initialize Convex client
// In production, this URL comes from environment variables
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";

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
