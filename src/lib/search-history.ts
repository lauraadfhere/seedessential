"use client";

import { useCallback, useEffect, useState } from "react";

/** Shared client-side search history (localStorage). Values are validated on
 * read so corrupted or tampered storage can never break the page. */
export const SEARCH_HISTORY_KEY = "tannelli.searchHistory.v1";
export const SEARCH_HISTORY_MAX = 8;
const TERM_MAX_LENGTH = 80;

export function normalizeSearchTerm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const term = value.replace(/\s+/g, " ").trim().slice(0, TERM_MAX_LENGTH);
  return term.length >= 2 ? term : null;
}

export function readSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of parsed) {
      const term = normalizeSearchTerm(item);
      if (!term || seen.has(term.toLowerCase())) continue;
      seen.add(term.toLowerCase());
      out.push(term);
      if (out.length >= SEARCH_HISTORY_MAX) break;
    }
    return out;
  } catch {
    return [];
  }
}

function writeSearchHistory(terms: string[]) {
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(terms));
  } catch {
    // Storage may be full or disabled; history is optional.
  }
}

/** Returns the list with `term` moved to the front (most recent first). */
export function pushSearchTerm(history: string[], term: string): string[] {
  const clean = normalizeSearchTerm(term);
  if (!clean) return history;
  const rest = history.filter((t) => t.toLowerCase() !== clean.toLowerCase());
  return [clean, ...rest].slice(0, SEARCH_HISTORY_MAX);
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(readSearchHistory());
    function onStorage(event: StorageEvent) {
      if (event.key === SEARCH_HISTORY_KEY) setHistory(readSearchHistory());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const remember = useCallback((term: string) => {
    setHistory((current) => {
      const next = pushSearchTerm(current, term);
      writeSearchHistory(next);
      return next;
    });
  }, []);

  const forget = useCallback((term: string) => {
    setHistory((current) => {
      const next = current.filter((t) => t !== term);
      writeSearchHistory(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    try {
      window.localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { history, remember, forget, clear };
}
