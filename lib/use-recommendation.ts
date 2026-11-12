"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { PriorRequest, RecommendResponse } from "./recommend-types";

const STATES = new Set([
  "recommend",
  "clarify",
  "decline",
  "no_match",
  "error",
]);

const PRIOR_KEY = "thread.prior.v1";

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

let memoryPrior: PriorRequest | null = null;
let priorLoaded = false;
const priorListeners = new Set<() => void>();

function readPrior(): PriorRequest | null {
  if (typeof window === "undefined") return null;
  if (priorLoaded) return memoryPrior;
  priorLoaded = true;

  try {
    const raw = window.sessionStorage.getItem(PRIOR_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      isRecord(value) &&
      isRecord(value.request) &&
      Array.isArray(value.missing)
    ) {
      memoryPrior = value as PriorRequest;
    }
  } catch {
    memoryPrior = null;
  }

  return memoryPrior;
}

function writePrior(next: PriorRequest | null): void {
  memoryPrior = next;
  priorLoaded = true;

  if (typeof window !== "undefined") {
    try {
      if (next === null) {
        window.sessionStorage.removeItem(PRIOR_KEY);
      } else {
        window.sessionStorage.setItem(PRIOR_KEY, JSON.stringify(next));
      }
    } catch {
      // Storage can be unavailable in private mode.
    }
  }

  for (const listener of priorListeners) listener();
}

function subscribePrior(listener: () => void): () => void {
  priorListeners.add(listener);
  return () => {
    priorListeners.delete(listener);
  };
}

function serverPrior(): PriorRequest | null {
  return null;
}

export type RecommendationController = {
  readonly message: string;
  readonly setMessage: (value: string) => void;
  readonly lastAsked: string;
  readonly result: RecommendResponse | null;
  readonly error: string | null;
  readonly loading: boolean;
  readonly hasPrior: boolean;
  readonly submit: (raw: string) => Promise<void>;
  readonly retry: () => void;
  readonly reset: () => void;
};

export function useRecommendation(): RecommendationController {
  const [message, setMessage] = useState("");
  const [lastAsked, setLastAsked] = useState("");
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prior = useSyncExternalStore(
    subscribePrior,
    readPrior,
    serverPrior,
  );

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
        body: JSON.stringify({
          message: text,
          session_id: sessionId(),
          prior: readPrior() ?? undefined,
        }),
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

      writePrior(payload.meta?.prior ?? null);
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

  function reset() {
    abortRef.current?.abort();
    writePrior(null);
    setResult(null);
    setLastAsked("");
    setError(null);
    setMessage("");
    setLoading(false);
    inFlightRef.current = false;
  }

  return {
    message,
    setMessage,
    lastAsked,
    result,
    error,
    loading,
    hasPrior: prior !== null,
    submit,
    retry,
    reset,
  };
}
