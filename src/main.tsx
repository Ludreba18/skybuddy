import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { logError } from "./lib/errorLogger";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

// Catches everything a toast wouldn't: crashes, and errors thrown outside of
// a request/click handler (e.g. a bad promise chain).
window.addEventListener("error", (event) => {
  logError("window.onerror", event.error ?? event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  logError("unhandledrejection", event.reason);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
);
