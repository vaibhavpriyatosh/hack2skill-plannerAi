"use client";

import { signIn } from "next-auth/react";
import styles from "@/app/page.module.css";

type GoogleSignInButtonProps = {
  disabled: boolean;
};

export function GoogleSignInButton({ disabled }: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      className={styles.ctaButton}
      onClick={() => void signIn("google", { callbackUrl: "/travel" })}
      disabled={disabled}
    >
      Continue with Google
    </button>
  );
}
