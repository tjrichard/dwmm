import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
// @ts-ignore
import { Client } from "npm:@notionhq/client";

// console.log("Hello from Modern Functions!");

Deno.serve(async (req) => {
    try {
        const body = await req.json();
        console.log("Webhook Payload:", JSON.stringify(body));

        const { record, old_record, type } = body;

        // Check for deletion events
        if (body.type === "page.deleted" || type === "page.deleted") {
            console.log("Skipping deleted page:", pageId);
            return new Response(JSON.stringify({ message: "Page was deleted, skipping." }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Context7 / Notion webhook payload handling
        // We assume the payload contains the Notion Page ID or the full object.
        // If it's a direct Notion Webhook (beta), structure might differ.
        // Adapting for generic "id" availability.

        // For this implementation, we assume we receive { id: "page-id", ... } or we can extract it.
        // Let's assume standard payload has `data` or `id`.
        // Extended ID extraction strategy
        const pageId = record?.id
            || body.data?.id
            || body.id
            || body.object?.id;

        if (!pageId) {
            console.error("Failed to extract Page ID. Body keys:", Object.keys(body));
            // Log deep structure for debugging
            console.log("Full Body:", JSON.stringify(body).substring(0, 1000));

            return new Response(JSON.stringify({
                message: "No Page ID found in payload (checked: record.id, data.id, id, object.id)"
            }), {
                headers: { "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Initialize Clients
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        const notion = new Client({ auth: Deno.env.get("NOTION_API_KEY") });
        const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") ?? "");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 1. Fetch Page Content
        console.log("Checkpoint 1: Fetching page content for", pageId);
        const page = await notion.pages.retrieve({ page_id: pageId });
        // fetch blocks/content (simplified for text)
        const blocks = await notion.blocks.children.list({ block_id: pageId });
        const pageText = JSON.stringify(blocks.results);
        console.log("Checkpoint 2: Page content retrieved, length:", pageText.length);

        // 2. AI Analysis
        console.log("Checkpoint 3: Starting AI Analysis");
        const prompt = `
      Analyze this Notion page content:
      ${pageText.substring(0, 3000)}
      
      Tasks:
      1. Suggest 3-5 tags.
      2. Summarize in 2 sentences.
      3. Classify into PARA (Projects, Areas, Resources, Archives).
      4. Suggest a search query to find related pages.
      
      Output JSON: { "tags": [], "summary": "", "para": "", "search_query": "" }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = JSON.parse(response.text().replace(/```json|```/g, ""));
        console.log("Checkpoint 4: AI Analysis Complete", analysis);

        // 3. Update Notion Properties (Tags, etc.)
        try {
            console.log("Checkpoint 5: Updating Notion Properties");
            await notion.pages.update({
                page_id: pageId,
                properties: {
                    // Adjust based on actual DB schema
                    // "Tags": { multi_select: analysis.tags.map(t => ({ name: t })) }, 
                },
            });
        } catch (e) {
            console.warn("Checkpoint 5 Warning: Failed to update properties", e);
        }

        // 4. Find Related Pages (Backlinks)
        console.log("Checkpoint 6: Generating Embedding");
        const embedding = await model.embedContent(pageText.substring(0, 1000));

        // Search Supabase
        console.log("Checkpoint 7: Searching Supabase");
        const { data: relatedPages, error: searchError } = await supabase.rpc("match_notion_pages", {
            query_embedding: embedding.embedding.values,
            match_threshold: 0.7,
            match_count: 5,
        });

        if (searchError) {
            console.error("Checkpoint 7 Error: Supabase RPC failed", searchError);
        } else {
            console.log("Checkpoint 8: Found related pages", relatedPages?.length);
        }

        if (relatedPages && relatedPages.length > 0) {
            // Add Backlinks
            console.log("Checkpoint 9: Appending backlinks");
            const linksBlock = {
                object: "block",
                type: "callout",
                callout: {
                    rich_text: [
                        { type: "text", text: { content: "Related Pages:\n" } },
                        ...relatedPages.map(p => ({
                            type: "text",
                            text: {
                                content: `- ${p.title}\n`, link: { url: `https://notion.so/${p.notion_id.replace(/-/g, "")}` }
                            }
                        }))
                    ]
                }
            };
            await notion.blocks.children.append({
                block_id: pageId,
                children: [linksBlock],
            });
        }

        // 5. Save/Index Current Page to Supabase
        console.log("Checkpoint 10: Upserting current page");
        const title = "New Page";
        await supabase.from("notion_pages").upsert({
            notion_id: pageId,
            title: title,
            summary: analysis.summary,
            embedding: embedding.embedding.values,
            para_category: analysis.para,
            tags: analysis.tags
        });

        console.log("Checkpoint 11: Success");

        return new Response(JSON.stringify({ success: true, analysis }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("FATAL ERROR:", error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});

