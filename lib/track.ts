/** GA4 이벤트 전송 (gtag가 없으면 무시) */
export function track(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === "function") w.gtag("event", name, params ?? {});
}
