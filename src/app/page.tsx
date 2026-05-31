"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { debounce } from "@/lib/utils/debounce";
import styles from "./page.module.css";

type MessageResponse = {
  message: string;
};

type ProfileResponse = {
  id: string;
  email: string;
  name: string | null;
  provider: string;
};

type ConfigResponse = {
  googleAuthConfigured: boolean;
};

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [apiMessage, setApiMessage] = useState("Loading backend status...");
  const [name, setName] = useState("");
  const [reply, setReply] = useState("");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [statusText, setStatusText] = useState("App loaded.");
  const [isGoogleAuthConfigured, setIsGoogleAuthConfigured] = useState(false);

  const debouncedStatusUpdate = useMemo(
    () => debounce((value: string) => setStatusText(value), 150),
    [],
  );

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
      }
    }

    void loadConfig();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMessage() {
      try {
        const response = await fetch("/api/message", {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("GET /api/message failed");
        }

        const data = (await response.json()) as MessageResponse;
        setApiMessage(data.message);
        debouncedStatusUpdate("Backend status loaded.");
      } catch {
        setApiMessage("Could not load backend status.");
        debouncedStatusUpdate("Failed to load backend status.");
      }
    }

    void loadMessage();

    return () => controller.abort();
  }, [debouncedStatusUpdate]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      if (status !== "authenticated") {
        setProfile(null);
        return;
      }

      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("GET /api/profile failed");
        }

        const data = (await response.json()) as ProfileResponse;
        setProfile(data);
        debouncedStatusUpdate("Authenticated profile loaded.");
      } catch {
        setProfile(null);
        debouncedStatusUpdate("Unable to load authenticated profile.");
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [status, debouncedStatusUpdate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setReply("");

    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };
      setReply(data.reply ?? data.error ?? "Unknown response");
      debouncedStatusUpdate("POST request complete.");
    } catch {
      setReply("Request failed. Please try again.");
      debouncedStatusUpdate("POST request failed.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Production-Ready Next.js Travel Engine Starter</h1>
          <p>
            Includes secure Google auth, hosted Postgres persistence, schema validation, logging, test
            setup, and accessibility-first UI patterns.
          </p>
          <p>After sign-in, you are redirected to the dedicated `/travel` operations dashboard.</p>
          <p className={styles.status} role="status" aria-live="polite">
            {statusText}
          </p>
        </header>

        <section className={styles.card} aria-labelledby="auth-heading">
          <h2 id="auth-heading">Authentication</h2>
          {status === "loading" ? <p>Checking session...</p> : null}

          {status !== "authenticated" ? (
            <>
              <button
                className={styles.button}
                type="button"
                onClick={() => void signIn("google", { callbackUrl: "/travel" })}
                aria-label="Sign in with Google"
                disabled={!isGoogleAuthConfigured}
              >
                Sign in with Google
              </button>
              {!isGoogleAuthConfigured ? (
                <p className={styles.warning}>
                  Add Google OAuth credentials in `.env.local` to enable sign-in.
                </p>
              ) : null}
            </>
          ) : (
            <div className={styles.sessionBox}>
              <p>
                Signed in as <strong>{session.user?.email ?? "Unknown user"}</strong>
              </p>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          )}
        </section>

        <section className={styles.card} aria-labelledby="api-heading">
          <h2 id="api-heading">Backend Health</h2>
          <p>{apiMessage}</p>
        </section>

        <section className={styles.card} aria-labelledby="profile-heading">
          <h2 id="profile-heading">Mapped User Profile</h2>
          {profile ? (
            <dl className={styles.profileGrid}>
              <div>
                <dt>User ID</dt>
                <dd>{profile.id}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{profile.name ?? "Not provided"}</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{profile.provider}</dd>
              </div>
            </dl>
          ) : (
            <p>Sign in to load your SQLite-backed user profile.</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="message-heading">
          <h2 id="message-heading">Validated API POST</h2>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="name-input">Name</label>
            <input
              id="name-input"
              className={styles.input}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={50}
            />
            <button className={styles.button} type="submit" disabled={isSending}>
              {isSending ? "Sending..." : "Send to API"}
            </button>
          </form>
          {reply ? (
            <p className={styles.reply} role="status" aria-live="polite">
              {reply}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
