import { toast as baseToast } from "sonner";
import { logError } from "@/lib/errorLogger";

type SonnerToast = typeof baseToast;

// Wraps sonner's toast.error so every error toast shown to a user - the
// most common way this app surfaces a failure after a click - gets logged,
// without having to touch every call site individually.
const error: SonnerToast["error"] = (message, ...args) => {
  logError("sonner-toast", typeof message === "string" ? message : "Fehlermeldung angezeigt", {
    context: { message },
  });
  return baseToast.error(message, ...args);
};

export const toast: SonnerToast = Object.assign(
  (...args: Parameters<SonnerToast>) => baseToast(...args),
  baseToast,
  { error }
);
