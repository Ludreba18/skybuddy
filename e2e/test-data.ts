import { createClient } from "@supabase/supabase-js";
import {
  sessionToStorageState,
  getTestUserFromStorageState,
} from "lovable-agent-playwright-config/supabase-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF!;

/** Creates a test user with confirmed email and returns their ID, email, and session. */
export async function createTestUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: "Test",
      last_name: "Pilot"
    }
  });

  if (error) throw new Error(`Failed to create test user: ${error.message}`);

  const { data: signInData, error: signInError } =
    await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (signInError || !signInData.session) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    throw new Error(`Failed to sign in test user: ${signInError?.message}`);
  }

  // Set trial for 30 days to enable premium features for testing
  await supabaseAdmin
    .from("profiles")
    .update({
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      nickname: "TestPilot",
      home_airport_icao: "EDDF",
      home_airport_name: "Frankfurt am Main"
    })
    .eq("user_id", data.user.id);

  return { id: data.user.id, email, session: signInData.session };
}

/** Deletes a test user by ID and cleans up related data. */
export async function deleteTestUser(userId: string) {
  try {
    // Get profile ID first
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profile) {
      // Delete related data in correct order (respecting foreign keys)
      await supabaseAdmin.from("forum_likes").delete().eq("profile_id", profile.id);
      await supabaseAdmin.from("forum_comments").delete().eq("author_id", profile.id);
      await supabaseAdmin.from("forum_posts").delete().eq("author_id", profile.id);
      await supabaseAdmin.from("event_participants").delete().eq("profile_id", profile.id);
      await supabaseAdmin.from("events").delete().eq("organizer_id", profile.id);
      await supabaseAdmin.from("posts").delete().eq("profile_id", profile.id);
      await supabaseAdmin.from("post_likes").delete().eq("profile_id", profile.id);
      await supabaseAdmin.from("notifications").delete().eq("profile_id", profile.id);
      await supabaseAdmin.from("notifications").delete().eq("actor_id", profile.id);
      await supabaseAdmin.from("contacts").delete().eq("profile_id", profile.id);
      await supabaseAdmin.from("contacts").delete().eq("contact_profile_id", profile.id);
      await supabaseAdmin.from("pilot_licenses").delete().eq("profile_id", profile.id);
      await supabaseAdmin.from("pilot_aircraft").delete().eq("profile_id", profile.id);
      await supabaseAdmin.from("pilot_interests").delete().eq("profile_id", profile.id);
      
      // Delete conversation participants and messages
      const { data: participations } = await supabaseAdmin
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", profile.id);
      
      if (participations) {
        for (const p of participations) {
          await supabaseAdmin.from("messages").delete().eq("conversation_id", p.conversation_id);
          await supabaseAdmin.from("conversation_participants").delete().eq("conversation_id", p.conversation_id);
          await supabaseAdmin.from("conversations").delete().eq("id", p.conversation_id);
        }
      }
    }

    // Finally delete the user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) console.warn(`Warning: Failed to delete test user ${userId}: ${error.message}`);
  } catch (err) {
    console.warn(`Warning: Error during test user cleanup: ${err}`);
  }
}

/** Converts a test user's session to Playwright storage state. */
export function testUserToStorageState(
  user: Awaited<ReturnType<typeof createTestUser>>,
  baseUrl: string
) {
  return sessionToStorageState(user.session, baseUrl, PROJECT_REF);
}

/** Gets the test user metadata from a storage state file. */
export function getTestUserFromFile(filePath: string, baseUrl: string) {
  return getTestUserFromStorageState(filePath, baseUrl);
}
