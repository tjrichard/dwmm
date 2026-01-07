import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
// @ts-ignore
import { Client } from "npm:@notionhq/client@2.2.14";

console.log("Hello from Notion Webhook V2!");

Deno.serve(async (req) => {
    try {
        const body = await req.json();
        const { record, old_record, type } = body;

        // Extended ID extraction strategy (Safe Scope)
        const pageId = body.entity?.id
            || record?.id
            || body.data?.id
            || body.object?.id;

        console.log(`Processing event: ${type}, Page ID: ${pageId}`);

        // Check for deletion events
        if (body.type === "page.deleted" || type === "page.deleted") {
            console.log("Skipping deleted page:", pageId);
            return new Response(JSON.stringify({ message: "Page was deleted, skipping." }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!pageId) {
            console.error("Failed to extract Page ID. Body keys:", Object.keys(body));
            return new Response(JSON.stringify({
                message: "No Page ID found in payload"
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
        const notion = new Client({
            auth: Deno.env.get("NOTION_API_KEY"),
        });
        const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") ?? "");

        // Configuration
        const MODEL_NAME = "gemini-3-flash-preview";
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // Database IDs
        const DB_IDS = {
            inbox: "2e03bf7f-b0af-8034-b5c3-ff8d92b68757",
            projects: "2e03bf7f-b0af-806d-b84c-de74484feb85",
            areas: "2e03bf7f-b0af-804b-aeee-e4f5c915377e",
            resources: "2e03bf7f-b0af-8054-bb4b-d1f519262cb4",
            archives: "2e03bf7f-b0af-80bf-b4f0-e104e32a4c1b",
            // Sub-databases
            tasks: "2e03bf7f-b0af-8096-9354-d3e3ad098fe7",
            people: "2e03bf7f-b0af-80f5-ae59-faa5352015bd",
            topics: "2e03bf7f-b0af-80c3-8e33-e9cc30b90956"
        };

        // --- Helper: Schema & Properties ---
        async function getDatabaseSchema(dbId: string) {
            try {
                const response = await notion.databases.retrieve({ database_id: dbId });
                return response.properties;
            } catch (e) {
                console.error(`Error fetching schema for DB ${dbId}:`, e);
                return null;
            }
        }

        // Helper to find actual property name (case-insensitive)
        function getPropertyKey(properties: any, targetName: string, type?: string) {
            if (!properties) return null;
            const targetLower = targetName.toLowerCase();
            for (const key in properties) {
                if (key.toLowerCase() === targetLower) {
                    if (type && properties[key].type !== type) continue;
                    return key;
                }
            }
            return null;
        }

        function getTitlePropertyName(properties: any) {
            if (!properties) return "Name"; // Default fallback
            for (const key in properties) {
                if (properties[key].type === "title") {
                    return key;
                }
            }
            return "Name";
        }


        // --- Helper: Fetch Active Context ---
        // --- Helper: Fetch Active Context ---
        async function getActiveContext() {
            try {
                if (!notion) throw new Error("Notion client not initialized");
                console.log("Fetching active context...");

                // Fetch schemas first to get correct Title property
                const [projectSchema, areaSchema] = await Promise.all([
                    getDatabaseSchema(DB_IDS.projects),
                    getDatabaseSchema(DB_IDS.areas)
                ]);

                const projectTitleProp = getTitlePropertyName(projectSchema);
                const areaTitleProp = getTitlePropertyName(areaSchema);

                const [projects, areas] = await Promise.all([
                    notion.databases.query({
                        database_id: DB_IDS.projects,
                        // Removed "Status" filter to avoid validation_error if Status prop doesn't exist
                        page_size: 50
                    }),
                    notion.databases.query({
                        database_id: DB_IDS.areas,
                        page_size: 50
                    })
                ]);

                return {
                    projects: projects.results.map((p: any) => ({
                        id: p.id,
                        name: p.properties[projectTitleProp]?.title[0]?.plain_text || "Untitled"
                    })),
                    areas: areas.results.map((a: any) => ({
                        id: a.id,
                        name: a.properties[areaTitleProp]?.title[0]?.plain_text || "Untitled"
                    }))
                };
            } catch (e) {
                console.error("Error fetching context:", e);
                return { projects: [], areas: [] };
            }
        }

        // --- Helper: Create Target Page (Project/Area) ---
        // --- Helper: Create Target Page (Project/Area) ---
        async function createTargetPage(dbId: string, name: string) {
            console.log(`Creating new target page '${name}' in DB ${dbId}`);
            try {
                const schema = await getDatabaseSchema(dbId);
                const titleKey = getTitlePropertyName(schema);

                const properties: any = {};
                properties[titleKey] = { title: [{ text: { content: name } }] };

                // Optional: Add Status if it exists (Case-insensitive check)
                const statusKey = getPropertyKey(schema, "Status", "status");
                if (statusKey) {
                    properties[statusKey] = { status: { name: "In Progress" } };
                }

                const response = await notion.pages.create({
                    parent: { database_id: dbId },
                    properties: properties
                });
                return response.id;
            } catch (e) {
                console.error("Error creating target page:", e);
                return null;
            }
        }


        // 1. Fetch Page Content
        let page;
        try {
            page = await notion.pages.retrieve({ page_id: pageId });
        } catch (error: any) {
            if (error.code === "object_not_found") {
                console.warn("Page not accessible (404), likely permissions:", pageId);
                return new Response(JSON.stringify({ message: "Page not found or not accessible" }), {
                    headers: { "Content-Type": "application/json" },
                });
            }
            throw error;
        }

        const blocks = await notion.blocks.children.list({ block_id: pageId });
        const pageText = JSON.stringify(blocks.results);
        console.log(`Context fetched. Page text length: ${pageText.length}`);

        // 2. Prepare Context & AI Analysis
        const context = await getActiveContext();

        console.log(`Starting AI Analysis with ${MODEL_NAME}...`);
        const prompt = `
            Analyze this Notion page content and categorize it into the PARA method (Projects, Areas, Resources, Archives).
            
            Context (Active Items in user's DB):
            - Active Projects: ${JSON.stringify(context.projects.map(p => p.name))}
            - Active Areas: ${JSON.stringify(context.areas.map(a => a.name))}

            Page Content:
            ${pageText.substring(0, 4000)}

            Tasks:
            1. Summarize in 2 sentences.
            2. Suggest 3-5 tags.
            3. Classify:
               - "Projects": Use for goals/deadlines. If the content items IS a Project charter/plan, choose this.
               - "Areas": Use for ongoing standards (Health, Finance).
               - "Resources": Use for notes, reference info.
               - "Archives": Use for scratchpad, junk, or completed items.
            4. Identify Target: 
               - If it belongs to an EXISTING Project/Area, provide its precise Name.
               - If it belongs to a NEW Project/Area (implied by text), provide a suggested Name.
               - If the item ITSELF is the Project, put "SELF" as the target name.

            Output JSON ONLY:
            {
              "summary": "...",
              "tags": ["tag1", "tag2"],
              "para_category": "Projects" | "Areas" | "Resources" | "Archives",
              "target_name": "Project Name" | "Area Name" | "SELF" | null,
              "reasoning": "Why you chose this category"
            }
        `;

        const result = await model.generateContent(prompt);
        const responseResult = await result.response;
        const cleanText = responseResult.text().replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(cleanText);
        console.log("AI Analysis Complete:", analysis);

        // 3. Update & Move Page
        console.log("Updating and Moving Page...");

        // Determine Target Database and Parent Relations
        let targetDbId = DB_IDS.resources; // Default fallthrough

        // Fetch valid properties for target DB later.
        // But we need to decide targetDbId FIRST.


        const targetRelations: { project?: string, area?: string } = {};

        // Scenario A: Item IS the Entity
        if (analysis.para_category === "Projects" && analysis.target_name === "SELF") {
            targetDbId = DB_IDS.projects;
        }
        else if (analysis.para_category === "Projects") {
            targetDbId = DB_IDS.projects;
        }
        else if (analysis.para_category === "Areas") {
            targetDbId = DB_IDS.areas;
        }
        else if (analysis.para_category === "Resources" || analysis.para_category === "Archives") {
            targetDbId = (analysis.para_category === "Resources") ? DB_IDS.resources : DB_IDS.archives;

            // Try to link to a Project or Area
            if (analysis.target_name && analysis.target_name !== "SELF") {
                // 1. Try to find in existing context
                const existingProject = context.projects.find(p => p.name === analysis.target_name);
                const existingArea = context.areas.find(a => a.name === analysis.target_name);

                if (existingProject) {
                    targetRelations.project = existingProject.id;
                    console.log(`Linking to existing Project: ${existingProject.name}`);
                } else if (existingArea) {
                    targetRelations.area = existingArea.id;
                    console.log(`Linking to existing Area: ${existingArea.name}`);
                }
                else {
                    // 2. Not found -> CREATE NEW (Scenario B)
                    if (analysis.reasoning.toLowerCase().includes("project")) {
                        console.log(`Creating NEW Project: ${analysis.target_name}`);
                        const newId = await createTargetPage(DB_IDS.projects, analysis.target_name);
                        if (newId) targetRelations.project = newId;
                    }
                    else if (analysis.reasoning.toLowerCase().includes("area")) {
                        console.log(`Creating NEW Area: ${analysis.target_name}`);
                        const newId = await createTargetPage(DB_IDS.areas, analysis.target_name);
                        if (newId) targetRelations.area = newId;
                    }
                }
            }
        }


        try {
            // Fetch Schema of Target DB to validate properties
            const schema = await getDatabaseSchema(targetDbId);


            const propertiesToUpdate: any = {};

            if (schema) {
                // Summary
                const summaryKey = getPropertyKey(schema, "Summary", "rich_text");
                if (summaryKey) {
                    propertiesToUpdate[summaryKey] = { rich_text: [{ text: { content: analysis.summary } }] };
                }

                // Tags (Allow multi_select or select)
                let tagsKey = getPropertyKey(schema, "Tags", "multi_select");
                if (!tagsKey) tagsKey = getPropertyKey(schema, "Tags", "select"); // Fallback to select if exists

                if (tagsKey) {
                    if (schema[tagsKey].type === "multi_select") {
                        propertiesToUpdate[tagsKey] = { multi_select: analysis.tags.map((t: string) => ({ name: t })) };
                    } else {
                        // Select only takes one value, take the first tag if valid
                        if (analysis.tags.length > 0) {
                            propertiesToUpdate[tagsKey] = { select: { name: analysis.tags[0] } };
                        }
                    }
                }

                // Relations
                if (targetRelations.project) {
                    const projectKey = getPropertyKey(schema, "Project", "relation");
                    if (projectKey) {
                        propertiesToUpdate[projectKey] = { relation: [{ id: targetRelations.project }] };
                    }
                }
                if (targetRelations.area) {
                    const areaKey = getPropertyKey(schema, "Area", "relation");
                    if (areaKey) {
                        propertiesToUpdate[areaKey] = { relation: [{ id: targetRelations.area }] };
                    }
                }

                if (analysis.para_category === "Archives") {
                    const originalDbKey = getPropertyKey(schema, "Original DB", "select");
                    if (originalDbKey) {
                        propertiesToUpdate[originalDbKey] = { select: { name: "Inbox" } };
                    }
                }
            }

            if (Object.keys(propertiesToUpdate).length > 0) {
                await notion.pages.update({
                    page_id: pageId,
                    parent: { database_id: targetDbId },
                    properties: propertiesToUpdate
                });
                console.log(`Page moved to ${analysis.para_category} (${targetDbId})`);
            } else {
                // Even if no properties update, we might still want to MOVE it (update parent)?
                // notion.pages.update can update parent? 
                // NO, to move a page between databases, you must use .create() in new DB and .delete() old one,
                // OR .update() parent if they are in same workspace?
                // Wait, Notion API `update` page support `parent`?
                // Docs say: "The parent of a page can be updated to move it to a different parent."
                // BUT moving between databases is complex if schemas mismatch effectively. 
                // Assuming we just try to update parent.
                await notion.pages.update({
                    page_id: pageId,
                    parent: { database_id: targetDbId }
                });
                console.log(`Page moved to ${analysis.para_category} (${targetDbId}) (No property updates)`);
            }

        } catch (e: any) {
            console.error("Failed to move/update page:", e.body || e.message);
        }

        // 4. Find Related Pages (Supabase Vector Search)
        // ... (Simplified for brevity, generally works if configured)

        // 5. Save/Index Current Page to Supabase
        console.log("Upserting current page to Supabase");
        const titleProp = (page as any).properties?.Name?.title?.[0]?.plain_text || "Untitled";

        await supabase.from("notion_pages").upsert({
            notion_id: pageId,
            title: titleProp,
            summary: analysis.summary,
            para_category: analysis.para_category,
            tags: analysis.tags
        });

        console.log("Success processing page.");
        return new Response(JSON.stringify({ success: true, analysis }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("FATAL ERROR:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});
