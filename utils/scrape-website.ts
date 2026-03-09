import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
// Define secret variables for API keys and tokens
const SCREENSHOT_API_TOKEN = Deno.env.get("SCREENSHOT_API_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// CORS 헤더 정의
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};
// Main function to handle requests
Deno.serve(async (req)=>{
  // CORS preflight 요청 처리
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }
  if (req.method === "POST") {
    try {
      const { url } = await req.json();
      const bookmarkId = await processBookmark(url);
      return new Response(JSON.stringify({
        message: "Bookmark created successfully",
        bookmarkId
      }), {
        status: 200,
        headers: corsHeaders
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          step: error.step || "unknown",
          partial: error.partial
        }
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
  }
  return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders
  });
});

// Function to fetch all unique tags from the 'bookmark_tags' table
async function fetchAllTags() {
  try {
    // 'tag' 컬럼을 선택합니다. (index.js에서 확인된 컬럼명)
    const { data, error } = await supabase.from("bookmark_tags").select("tag");
    if (error) {
      // 프로세스를 중단시키지 않기 위해 에러를 로깅만 하고 빈 배열을 반환합니다.
      console.error("Error fetching bookmark_tags:", error.message);
      return [];
    }
    // [{tag: 'tag1'}, {tag: 'tag2'}] 형태의 배열을 ['tag1', 'tag2'] 형태의 문자열 배열로 변환합니다.
    return data ? data.map((item) => item.tag) : [];
  } catch (error) {
    console.error("Exception in fetchAllTags:", error.message);
    return [];
  }
}

// Function to process the bookmark
async function processBookmark(url) {
  let cleanedHtmlContent, parsedMetadata, structuredOutput, bookmarkId;
  try {
    // 1. HTML fetch/파싱/메타 추출(동기)
    const htmlContent = await fetchHtmlContent(url);
    parsedMetadata = parseMetadata(htmlContent).parsedMetadata;
    cleanedHtmlContent = cleanHtmlContent(htmlContent);
    const allTags = await fetchAllTags(); // DB에서 모든 기존 태그 목록을 가져옴
    // 2. Gemini API 호출을 병렬로 준비
    const geminiPromise = callGeminiApi(parsedMetadata, cleanedHtmlContent, url, allTags);

    // 3. Gemini 결과 대기
    structuredOutput = await geminiPromise;
    // 4. bookmarkId 생성을 위해 썸네일 주소 고정값 적용
    // bookmarkId는 저장 후 받아옴
    // 썸네일 주소는 Supabase public URL 포맷 고정
    // bookmarkId는 저장 후 알 수 있으므로, 우선 썸네일 주소 없이 저장 후 update하지 않고,
    // insert 시점에 썸네일 주소를 넣기 위해 id를 미리 예측할 수 없으므로,
    // insert 후 썸네일 주소를 update하는 대신, insert 후 클라이언트에서 썸네일 주소를 예측하도록 한다.
    // (즉, DB에는 썸네일 주소를 저장하지 않거나, 저장하려면 insert 후 update 필요)
    // 여기서는 DB에 썸네일 주소를 저장하는 방식으로 구현
    // 5. bookmark 저장 (썸네일 주소는 bookmarkId를 알아야 하므로, 2단계로 처리)
    // 1) 썸네일 주소 없이 저장
    bookmarkId = await saveBookmark(structuredOutput);
    // 2) 썸네일 주소 생성
    const thumbnailUrl = `${SUPABASE_URL}/storage/v1/object/public/assets/bookmarks/${bookmarkId}/thumbnail.webp`;
    // 3) 썸네일 주소 update (비동기, 실패해도 무시)
    updateBookmarkThumbnail(bookmarkId, thumbnailUrl).catch(()=>{});
    // 6. 썸네일 업로드는 백그라운드로(실패해도 무시)
    captureScreenshot(url, bookmarkId).catch(()=>{});
    return bookmarkId;
  } catch (error) {
    error.partial = {
      cleanedHtmlContent,
      parsedMetadata,
      structuredOutput,
      bookmarkId
    };
    throw error;
  }
}
// Function to fetch HTML content
async function fetchHtmlContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML content from ${url}`);
    }
    return await response.text();
  } catch (error) {
    error.step = "fetchHtmlContent";
    throw error;
  }
}
// HTML에서 script, style, noscript 태그를 제거하고 body의 모든 element의 태그 이름과 innerText만 추출하는 함수
function cleanHtmlContent(htmlContent) {
  const parser = new DOMParser();
  const document = parser.parseFromString(htmlContent, "text/html");
  [
    "script",
    "style",
    "noscript"
  ].forEach((tag)=>{
    document.querySelectorAll(tag).forEach((el)=>el.remove());
  });
  // 태그+텍스트 조합으로 중복 제거
  const seen = new Set();
  const allowedTags = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "section",
    "article",
    "header",
    "footer",
    "main"
  ];
  let lines = [];
  if (document.body) {
    const traverse = (node)=>{
      if (node.nodeType === 1) {
        // ELEMENT_NODE
        const tagName = node.tagName.toLowerCase();
        let innerText = node.textContent.replace(/\s+/g, " ").trim();
        const key = `${tagName}|${innerText}`;
        if (innerText && allowedTags.includes(tagName) && !seen.has(key)) {
          lines.push(`<${tagName}>${innerText}</${tagName}>`);
          seen.add(key);
        }
        Array.from(node.children).forEach((child)=>traverse(child));
      }
    };
    traverse(document.body);
  }
  return lines.join("");
}
// Function to parse metadata from HTML content
function parseMetadata(htmlContent) {
  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(htmlContent, "text/html");
    const metadata = {};
    // <title> 태그 추출
    const titleTag = document.querySelector("title");
    if (titleTag && titleTag.textContent) {
      metadata["title"] = titleTag.textContent.trim();
    }
    // meta 태그 중 description, og:title, og:description, keywords 만 추출
    const metaTags = document.querySelectorAll("meta");
    metaTags.forEach((meta)=>{
      const name = meta.getAttribute("name");
      const property = meta.getAttribute("property");
      const content = meta.getAttribute("content");
      if (typeof content === "string") {
        if (name === "description" || name === "keywords") {
          metadata[name] = content.trim();
        }
        if (property === "og:title" || property === "og:description") {
          metadata[property] = content.trim();
        }
      }
    });
    // parsedMetadata는 meta 태그만 LLM이 알아보기 쉽게 반환
    const parsedMetadata = Object.entries(metadata).map(([key, value])=>{
      if (key === "title") {
        return `<title>${value}</title>`;
      } else if (key === "keywords" || key === "description") {
        return `<meta name=\"${key}\" content=\"${value}\">`;
      } else {
        return `<meta property=\"${key}\" content=\"${value}\">`;
      }
    }).join("\n");
    return {
      parsedMetadata
    };
  } catch (error) {
    error.step = "parseMetadata";
    throw error;
  }
}
// Function to call the Gemini API (REST API 직접 호출)
async function callGeminiApi(parsedMetadata, htmlContents, url, allTags: string[] = []) {
  try {
    const tagInstruction = allTags.length > 0 ? `When generating tags, you MUST STRONGLY PREFER selecting from this list of existing tags if they are applicable: [${allTags.join(', ')}]. Only generate a new tag if a suitable one cannot be found in the provided list.` : `Ensure tags are useful for search and discovery.`;
    const successSystemInstruction = `Analyze the provided input and generate a structured output. Instructions: 1. Title: Use the given title directly unless it is too descriptive. If needed, infer a concise and noun-based title. 2. Description: Summarize the provided description and htmlContents to create a concise and informative description. Ensure clarity and relevance. Then add relevant meta keywords that would be useful for search. Provide keywords in both Korean and English, considering possible typos and include as many as possible. Separate each keyword with a comma. 3. Category: Determine the most suitable category from the following: 'AI', 'Collection', 'Website', 'Article', 'Service', 'Book'. If the content curates multiple resources, classify it as 'Collection'. 4. Tags: Extract 3 to 5 relevant tags based on the provided keywords, description, and htmlContents. ${tagInstruction} 5. Original_link: Always include the provided URL as the original_link value. Return the result in the following JSON schema: {'type':'object','properties':{'title':{'type':'string'},'description':{'type':'string'},'category':{'type':'string','enum':['AI','Collection','Website','Article','Service','Book']},'tags':{'type':'array','items':{'type':'string'}},'original_link':{'type':'string'},'required':['title','category','original_link'],'propertyOrdering':['title','description','category','tags','original_link']}`;
    const apiKey = GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const prompt = `\n${successSystemInstruction}\n\n[Meta 정보]\n${parsedMetadata}\n\n[본문 콘텐츠]\n${htmlContents}\n\n[URL]\n${url}\n`;
    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`Gemini API 호출 실패: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    let geminiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    // 코드블록(```json ... ```)이 있으면 제거
    geminiResponseText = geminiResponseText.replace(/```json|```/g, '').trim();
    return JSON.parse(geminiResponseText);
  } catch (error) {
    error.step = 'callGeminiApi';
    throw error;
  }
}
// 커스텀 에러 클래스 정의
class BookmarkError extends Error {
  step;
  partial;
  constructor(message, step, partial){
    super(message);
    this.name = "BookmarkError";
    this.step = step;
    this.partial = partial;
  }
}
// Function to save the bookmark in Supabase
async function saveBookmark(structuredOutput) {
  try {
    const { data: bookmarkData, error: bookmarkError } = await supabase.from("bookmarks").insert([
      {
        ...structuredOutput
      }
    ], {
      returning: "representation"
    });
    if (bookmarkError) {
      throw new BookmarkError(bookmarkError.message, "saveBookmark", {
        structuredOutput
      });
    }
    // bookmarkData가 null이거나 빈 배열일 수 있으니 방어적으로 처리
    if (!bookmarkData || bookmarkData.length === 0) {
      // original_link가 유니크하다면, 해당 값으로 다시 조회
      const { data: selectData, error: selectError } = await supabase.from("bookmarks").select("id").eq("original_link", structuredOutput.original_link).order("created_at", {
        ascending: false
      }).limit(1);
      if (selectError || !selectData || selectData.length === 0) {
        throw new BookmarkError("Bookmark insert 후 id를 찾을 수 없습니다.", "saveBookmark-select", {
          structuredOutput
        });
      }
      return selectData[0].id;
    }
    return bookmarkData[0].id;
  } catch (error) {
    if (error instanceof BookmarkError) {
      throw error;
    }
    throw new BookmarkError(error.message, error.step || "saveBookmark", error.partial || {
      structuredOutput
    });
  }
}
// Function to capture a screenshot and upload to Supabase Storage
async function captureScreenshot(url, bookmarkId) {
  try {
    // Doppio API 호출 (sync, webp, 1920x1080, waitUntil: networkidle0, fullPage: false)
    const doppioApiToken = Deno.env.get("DOPPIO_API_TOKEN");
    if (!doppioApiToken) {
      throw new Error("DOPPIO_API_TOKEN is not set in environment variables");
    }
    const doppioResponse = await fetch("https://api.doppio.sh/v1/render/screenshot/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${doppioApiToken}`
      },
      body: JSON.stringify({
        page: {
          goto: {
            url: url,
            options: {
              waitUntil: [
                "networkidle0"
              ]
            }
          },
          screenshot: {
            type: "webp",
            fullPage: false,
            quality: 100,
            captureBeyondViewport: true,
            omitBackground: false
          }
        },
        launch: {
          defaultViewport: {
            width: 1920,
            height: 1080
          }
        }
      })
    });
    if (!doppioResponse.ok) {
      throw new Error(`Failed to capture screenshot from Doppio for ${url}`);
    }
    const doppioData = await doppioResponse.json();
    if (!doppioData.documentUrl) {
      throw new Error("Doppio API did not return a documentUrl");
    }
    // Doppio에서 받은 documentUrl에서 이미지 fetch
    const imageResponse = await fetch(doppioData.documentUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch screenshot image from Doppio documentUrl for ${url}`);
    }
    const imageBlob = await imageResponse.blob();
    const imageArrayBuffer = await imageBlob.arrayBuffer();
    const imageFile = new Uint8Array(imageArrayBuffer);
    // Supabase Storage에 업로드 (webp 확장자 사용)
    const { data: uploadData, error: uploadError } = await supabase.storage.from("assets").upload(`bookmarks/${bookmarkId}/thumbnail.webp`, imageFile, {
      contentType: "image/webp",
      upsert: true
    });
    if (uploadError) {
      throw new Error(uploadError.message);
    }
    // public URL 생성
    const { data: publicUrlData } = supabase.storage.from("assets").getPublicUrl(`bookmarks/${bookmarkId}/thumbnail.webp`);
    return publicUrlData.publicUrl;
  } catch (error) {
    error.step = "captureScreenshot";
    throw error;
  }
}
async function updateBookmarkThumbnail(bookmarkId, thumbnailPath) {
  try {
    const { error: updateError } = await supabase.from("bookmarks").update({
      thumbnail: thumbnailPath
    }).eq("id", bookmarkId);
    if (updateError) throw new Error(updateError.message);
  } catch (error) {
    error.step = "updateBookmarkThumbnail";
    throw error;
  }
}
