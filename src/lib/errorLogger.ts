import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ErrorLogSource =
  | "window.onerror"
  | "unhandledrejection"
  | "react-error-boundary"
  | "toast"
  | "sonner-toast";

interface LogErrorOptions {
  context?: Record<string, unknown>;
}

// Fire-and-forget: logging must never throw or block the UI it's trying to
// debug. Runs for every uncaught error and every error message shown to a
// user, so we can find and fix real bugs from actual usage.
export async function logError(source: ErrorLogSource, error: unknown, options: LogErrorOptions = {}) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const { data } = await supabase.auth.getSession();

    await supabase.from("error_logs").insert({
      source,
      message,
      stack,
      context: (options.context as Json) ?? null,
      user_id: data.session?.user?.id ?? null,
      path: window.location.pathname,
      user_agent: navigator.userAgent,
    });
  } catch {
    // swallow - never let the logger itself break the app
  }
}
