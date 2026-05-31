"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import styles from "./page.module.css";

type ConfigResponse = {
  googleAuthConfigured: boolean;
};

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const [isGoogleAuthConfigured, setIsGoogleAuthConfigured] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/travel");
    }
  }, [router, status]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadConfig() {
      try {
        const response = await fetch("/api/config", {
          signal: controller.signal,
        });

        const data = (await response.json()) as ConfigResponse;
        setIsGoogleAuthConfigured(data.googleAuthConfigured);
      } catch {
        setIsGoogleAuthConfigured(false);
      } finally {
        setIsLoadingConfig(false);
      }
    }

    void loadConfig();

    return () => controller.abort();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.badge}>Plan Smarter, Travel Better</p>
          <h1>Build your perfect trip itinerary in minutes</h1>
          <p className={styles.subtitle}>
            Personalized day-wise travel plans with instant replanning, budget-aware suggestions,
            and destination highlights.
          </p>

          <div className={styles.ctaBlock}>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={() => void signIn("google", { callbackUrl: "/travel" })}
              disabled={!isGoogleAuthConfigured || isLoadingConfig || status === "loading"}
            >
              {status === "loading"
                ? "Checking session..."
                : isLoadingConfig
                  ? "Preparing login..."
                  : "Continue with Google"}
            </button>

            {!isGoogleAuthConfigured && !isLoadingConfig ? (
              <p className={styles.warning}>
                Login is temporarily unavailable. Please try again in a moment.
              </p>
            ) : null}
          </div>
        </section>

        <section className={styles.preview} aria-hidden="true">
          <article className={`${styles.mockCard} ${styles.cardLeft}`}>
            <div className={styles.mockHeader} />
            <div className={styles.mockImageA} />
            <div className={styles.mockLine} />
            <div className={styles.mockLineShort} />
          </article>
          <article className={`${styles.mockCard} ${styles.cardCenter}`}>
            <div className={styles.mockHeader} />
            <div className={styles.mockImageB} />
            <div className={styles.mockLine} />
            <div className={styles.mockLineShort} />
          </article>
          <article className={`${styles.mockCard} ${styles.cardRight}`}>
            <div className={styles.mockHeader} />
            <div className={styles.mockImageC} />
            <div className={styles.mockLine} />
            <div className={styles.mockLineShort} />
          </article>
        </section>
      </main>
    </div>
  );
}
