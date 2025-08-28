import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "b3yc0l8f",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});