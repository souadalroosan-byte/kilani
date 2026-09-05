import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function extractDriveId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?id=([^&]+)/,
    /docs\.google\.com\/.*\/d\/([^/]+)/,
    /docs\.google\.com\/uc\?id=([^&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url, folder } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let fetchUrl = url;
    const driveId = extractDriveId(url);
    if (driveId) {
      fetchUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
    }

    const imgRes = await fetch(fetchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ACI-JUST-Bot/1.0)" },
    });

    if (!imgRes.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch image (status ${imgRes.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "The link is not a direct image. For Google Drive, make sure the file is shared as 'Anyone with the link'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const blob = await imgRes.blob();
    const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
    const fileName = `${folder || "misc"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: uploadError } = await supabase.storage
      .from("aci-just-images")
      .upload(fileName, blob, { contentType, cacheControl: "3600", upsert: false });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data } = supabase.storage.from("aci-just-images").getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ url: data.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
