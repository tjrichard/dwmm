const supabaseProjectUrl =
  process.env.NEXT_PUBLIC_DWMM_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

function getStringValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.url || value.publicUrl || value.public_url || value.src || value.path || "";
  }
  return String(value);
}

export function normalizeBookmarkThumbnail(value) {
  let thumbnail = getStringValue(value).trim();
  if (!thumbnail) return null;

  try {
    const parsed = JSON.parse(thumbnail);
    thumbnail = getStringValue(parsed).trim() || thumbnail;
  } catch (error) {
    // Plain URL/path strings are the common case.
  }

  thumbnail = thumbnail.replace(/^['"]|['"]$/g, "").trim();
  if (!thumbnail) return null;

  if (/^(https?:)?\/\//i.test(thumbnail) || /^(data|blob):/i.test(thumbnail)) {
    return thumbnail.startsWith("//") ? `https:${thumbnail}` : thumbnail;
  }

  if (!supabaseProjectUrl) return thumbnail.startsWith("/") ? thumbnail : `/${thumbnail}`;

  const origin = supabaseProjectUrl.replace(/\/$/, "");
  const path = thumbnail.replace(/^\/+/, "");
  if (path.startsWith("storage/v1/object/public/")) return `${origin}/${path}`;
  if (path.startsWith("assets/")) return `${origin}/storage/v1/object/public/${path}`;
  if (path.startsWith("bookmarks/")) return `${origin}/storage/v1/object/public/assets/${path}`;

  return thumbnail.startsWith("/") ? thumbnail : `/${thumbnail}`;
}
