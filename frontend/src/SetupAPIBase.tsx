// Force every relative "/api/..." fetch to go to your backend host
const API_BASE = (import.meta.env.VITE_API_BASE || "https://knighthoot.app").replace(/\/+$/, "");

if (API_BASE) {
  const origFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === "string" ? input : (input as Request).url;
    if (url.startsWith("/api")) url = API_BASE + url;
    return origFetch(url as any, init);
  };
  console.log("[setupApiBase] Using", API_BASE, "for relative /api calls");
}
