"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const ROOT_PATHS = ["/", "/explore", "/profile"];

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function BackExitHandler() {
  const pathname = usePathname();
  const [showToast, setShowToast] = useState(false);
  const exitPending = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atRootRef = useRef(ROOT_PATHS.includes(pathname));

  useEffect(() => {
    atRootRef.current = ROOT_PATHS.includes(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!isStandalone()) return;

    const handlePopState = (e: PopStateEvent) => {
      const wasAtRoot = atRootRef.current;
      atRootRef.current = ROOT_PATHS.includes(location.pathname);

      if (!wasAtRoot) return;

      e.stopImmediatePropagation();

      if (exitPending.current) {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        exitPending.current = false;
        setShowToast(false);
        history.go(-(history.length));
        return;
      }

      history.pushState({ appRoot: true }, "");
      exitPending.current = true;
      setShowToast(true);
      toastTimer.current = setTimeout(() => {
        exitPending.current = false;
        setShowToast(false);
      }, 2000);
    };

    window.addEventListener("popstate", handlePopState, true);
    return () => {
      window.removeEventListener("popstate", handlePopState, true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isStandalone()) return;
    if (!ROOT_PATHS.includes(pathname)) return;

    exitPending.current = false;
    setShowToast(false);
    if (toastTimer.current) clearTimeout(toastTimer.current);

    history.pushState({ appRoot: true }, "");
  }, [pathname]);

  if (!showToast) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-full bg-neutral-900/90 dark:bg-neutral-100/90 text-white dark:text-neutral-900 text-sm font-medium pointer-events-none whitespace-nowrap">
      Press back again to exit
    </div>
  );
}
