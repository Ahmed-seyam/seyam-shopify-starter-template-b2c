"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Wishlist state — product handles in localStorage (guest-first; logged-in
 * metafield sync merges on top of this store). All hook instances stay in
 * sync via the "wishlist:updated" event.
 */

const STORAGE_KEY = "wishlist";
const EVENT = "wishlist:updated";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((h) => typeof h === "string") : [];
  } catch {
    return [];
  }
}

function write(handles: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
  window.dispatchEvent(new Event(EVENT));
}

let cache: string[] = [];
let cacheJson = "[]";

function getSnapshot(): string[] {
  const next = read();
  const json = JSON.stringify(next);
  if (json !== cacheJson) {
    cache = next;
    cacheJson = json;
  }
  return cache;
}

const emptySnapshot: string[] = [];

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useWishlist() {
  const handles = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => emptySnapshot
  );

  const has = useCallback(
    (handle: string) => handles.includes(handle),
    [handles]
  );

  const toggle = useCallback(
    (handle: string): boolean => {
      const current = read();
      const added = !current.includes(handle);
      write(
        added ? [...current, handle] : current.filter((h) => h !== handle)
      );
      return added;
    },
    []
  );

  const remove = useCallback((handle: string) => {
    write(read().filter((h) => h !== handle));
  }, []);

  return { handles, count: handles.length, has, toggle, remove };
}
