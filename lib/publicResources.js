import { supabase } from "./supabase";
import { normalizeResources } from "./workspace";

export async function getPublicResources() {
  const { data, error } = await supabase
    .from("bookmarks_public")
    .select(`
      id,
      title,
      description,
      original_link,
      category,
      tags,
      vote_count,
      created_at,
      highlight
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return normalizeResources(data || []);
}
