import { useMemo } from 'react';
import { useAuth } from './useAuth';

interface AccessStatus {
  hasActiveAccess: boolean;
  daysRemaining: number;
  isInTrial: boolean;
  isPremium: boolean;
  trialEndsAt: Date | null;
}

// BETA PHASE: paywall is switched off so every signed-in user has full access.
// The real trial/premium check below still runs (so daysRemaining/trialEndsAt stay
// accurate for display), it just no longer gates hasActiveAccess/isInTrial. Flip
// this back to true once pricing is decided - matches the DB-side flag in
// supabase/migrations/20260902000000_disable_paywall_for_beta.sql.
export const PAYWALL_ENABLED = false;

export function useAccessStatus(): AccessStatus {
  const { profile } = useAuth();

  return useMemo(() => {
    if (!profile) {
      return {
        hasActiveAccess: !PAYWALL_ENABLED,
        daysRemaining: 0,
        isInTrial: false,
        isPremium: false,
        trialEndsAt: null,
      };
    }

    const now = new Date();
    const isPremium = profile.membership_tier === 'premium';

    // Check if premium is active
    const premiumActive = isPremium && (
      !profile.membership_expires_at ||
      new Date(profile.membership_expires_at) > now
    );

    // Check trial status
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const trialActive = trialEndsAt ? trialEndsAt > now : false;

    // Calculate days remaining in trial
    const daysRemaining = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const hasActiveAccess = PAYWALL_ENABLED ? premiumActive || trialActive : true;
    const isInTrial = PAYWALL_ENABLED ? !isPremium && trialActive : false;

    return {
      hasActiveAccess,
      daysRemaining,
      isInTrial,
      isPremium: premiumActive,
      trialEndsAt,
    };
  }, [profile]);
}
