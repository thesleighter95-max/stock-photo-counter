import { getStore } from "@netlify/blobs";

const PHOTO_STORE = "stock-photos";

export default async (req) => {
  try {
    if (req.method.toUpperCase() !== "GET") {
      return new Response("Method tidak didukung", { status: 405 });
    }

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();

    if (!/^[a-f0-9-]{20,60}$/i.test(id)) {
      return new Response("ID foto tidak valid", { status: 400 });
    }

    const store = getStore(PHOTO_STORE);
    const key = `photos/${id}.jpg`;

    const [blob, metadata] = await Promise.all([
      store.get(key, { type: "blob", consistency: "strong" }),
      store.getMetadata(key, { consistency: "strong" }),
    ]);

    if (!blob) return new Response("Foto tidak ditemukan", { status: 404 });

    const contentType =
      metadata?.metadata?.contentType ||
      blob.type ||
      "image/jpeg";

    return new Response(blob, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600",
        "content-disposition": `inline; filename="foto-${id}.jpg"`,
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("photo function error:", error);
    return new Response("Server error", { status: 500 });
  }
};

export const config = {
  path: "/api/photo",
};
