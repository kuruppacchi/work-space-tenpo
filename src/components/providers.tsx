"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

export function AppProviders({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      emailOTP
      social={{ providers: ["google"] }}
      redirectTo="/"
      signUp={false}
      Link={Link}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
