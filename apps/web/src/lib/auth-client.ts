"use client";

import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        // Called by the auth client outside React; a full navigation is intended here.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/two-factor";
      },
    }),
  ],
});
