import { supabase } from "./supabase";
import { normalizeResources } from "./workspace";

export async function getPublicResources({ limit } = {}) {
  let query = supabase
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
      highlight,
      thumbnail
    `)
    .order("created_at", { ascending: false });

  if (Number.isInteger(limit) && limit > 0) {
    query = query.range(0, limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return normalizeResources(data || []);
}
