"use client";

import { useEffect, useRef, useState } from "react";

import type { RecommendResponse } from "./recommend-types";

const STATES = new Set([
  "recommend",
  "clarify",
  "decline",
  "no_match",
  "error",
]);

function newSessionId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `ses_${crypto.randomUUID()}`;
  }
  return `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isErrorPayload(value: unknown): value is { message: string } {
  return isRecord(value) && typeof value.message === "string";
}

function isRecommendResponse(value: unknown): value is RecommendResponse {
  return (
    isRecord(value) &&
    typeof value.state === "string" &&
    STATES.has(value.state) &&
    typeof value.message === "string" &&
    Array.isArray(value.items)
  );
}

export type RecommendationController = {
  readonly message: string;
  readonly setMessage: (value: string) => void;
  readonly lastAsked: string;
  readonly result: RecommendResponse | null;
  readonly error: string | null;
  readonly loading: boolean;
  readonly submit: (raw: string) => Promise<void>;
  readonly retry: () => void;
};

export function useRecommendation(): RecommendationController {
  const [message, setMessage] = useState("");
  const [lastAsked, setLastAsked] = useState("");
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function sessionId(): string {
    if (sessionRef.current === null) {
      sessionRef.current = newSessionId();
    }
    return sessionRef.current;
  }

  async function submit(raw: string) {
    const text = raw.trim();
    if (text.length < 3 || inFlightRef.current) return;

    inFlightRef.current = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);
    setLastAsked(text);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId() }),
        signal: controller.signal,
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        setError(
          isErrorPayload(payload)
            ? payload.message
            : "The stylist didn't answer. Try again.",
        );
        return;
      }

      if (!isRecommendResponse(payload)) {
        setError("The stylist sent something unreadable. Try again.");
        return;
      }

      setResult(payload);
      setMessage("");
    } catch (caught) {
      if (caught instanceof Error && caught.name === "AbortError") return;
      setError("Couldn't reach the stylist. Check the connection and try again.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }

  function retry() {
    void submit(lastAsked);
  }

  return {
    message,
    setMessage,
    lastAsked,
    result,
    error,
    loading,
    submit,
    retry,
  };
}
