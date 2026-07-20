"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { captureUtmParams, initCleverTap, initGtm, track } from "@/plugins/client/tracking";

/**
 * Analytics bootstrap, mounted once in the root layout. Captures UTM params
 * on landing, initializes GTM and CleverTap during idle time (never blocking
 * paint), and reports SPA page views on every route change. Vendors without
 * a NEXT_PUBLIC_* id configured are simply skipped.
 */
export function Analytics() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    captureUtmParams();

    const init = () => {
      const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
      if (gtmId) initGtm(gtmId);

      const clevertapId = process.env.NEXT_PUBLIC_CLEVERTAP_ACCOUNT_ID;
      if (clevertapId)
        initCleverTap(clevertapId, process.env.NEXT_PUBLIC_CLEVERTAP_REGION);
    };

    if (typeof requestIdleCallback !== "undefined") requestIdleCallback(init);
    else setTimeout(init, 2000);
  }, []);

  useEffect(() => {
    // Small delay lets the new document title settle before it's reported.
    const timer = setTimeout(() => track.pageView(pathname), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
