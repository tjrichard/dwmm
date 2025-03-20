import { supabase } from "./supabase";

/**
 * Fetches all website IDs that the current user has voted for
 * @returns {Promise<string[]>} Array of website IDs the user has voted for
 */
export async function getUserVotedWebsites() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("vote")
      .select("website_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user votes:", error);
      return [];
    }

    return data.map((vote) => vote.website_id);
  } catch (err) {
    console.error("Exception fetching user votes:", err);
    return [];
  }
}
