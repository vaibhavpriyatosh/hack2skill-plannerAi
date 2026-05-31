import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getEnv } from "@/lib/env";
import { GoogleSignInButton } from "@/components/google-signin-button";
import styles from "./page.module.css";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/travel");
  }

  const env = getEnv();
  const isGoogleAuthConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

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
            <GoogleSignInButton disabled={!isGoogleAuthConfigured} />

            {!isGoogleAuthConfigured ? (
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
