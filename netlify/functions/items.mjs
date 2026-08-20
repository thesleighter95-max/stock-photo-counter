import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

const DATA_STORE = "stock-items";
const PHOTO_STORE = "stock-photos";
const MAX_PHOTO_BYTES = 4_000_000;

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export default async (req) => {
  try {
    const method = req.method.toUpperCase();
    const url = new URL(req.url);
    const dataStore = getStore(DATA_STORE);
    const photoStore = getStore(PHOTO_STORE);

    if (method === "GET") {
      const { blobs } = await dataStore.list();
      const items = [];

      for (const entry of blobs) {
        const item = await dataStore.get(entry.key, {
          type: "json",
          consistency: "strong",
        });
        if (item) items.push(item);
      }

      items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return json({ items });
    }

    if (method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return json({ error: "Content-Type harus multipart/form-data." }, 400);
      }

      const form = await req.formData();
      const photo = form.get("photo");

      if (!(photo instanceof File)) {
        return json({ error: "Foto wajib dikirim." }, 400);
      }

      if (!photo.type.startsWith("image/")) {
        return json({ error: "File harus berupa gambar." }, 400);
      }

      if (photo.size <= 0 || photo.size > MAX_PHOTO_BYTES) {
        return json({ error: "Ukuran foto harus lebih dari 0 dan maksimal 4 MB." }, 400);
      }

      const name = cleanText(form.get("name"), 150);
      const qty = Number.parseInt(String(form.get("qty") ?? ""), 10);
      const unit = cleanText(form.get("unit"), 30) || "pcs";
      const notes = cleanText(form.get("notes"), 500);
      const location = cleanText(form.get("location"), 350);
      const lat = cleanText(form.get("lat"), 40);
      const lng = cleanText(form.get("lng"), 40);
      const accuracy = cleanText(form.get("accuracy"), 40);

      if (!name) return json({ error: "Nama barang wajib diisi." }, 400);
      if (!Number.isInteger(qty) || qty < 1 || qty > 1_000_000) {
        return json({ error: "Qty tidak valid." }, 400);
      }

      const id = randomUUID();
      const createdAt = new Date().toISOString();
      const photoKey = `photos/${id}.jpg`;
      const dataKey = `items/${id}.json`;

      await photoStore.set(photoKey, photo, {
        metadata: {
          contentType: photo.type || "image/jpeg",
          originalName: cleanText(photo.name, 120),
          itemId: id,
        },
      });

      const item = {
        id,
        name,
        qty,
        unit,
        notes,
        location,
        lat,
        lng,
        accuracy,
        createdAt,
        displayTime: new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Makassar",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date(createdAt)),
        photoKey,
      };

      try {
        await dataStore.setJSON(dataKey, item);
      } catch (error) {
        await photoStore.delete(photoKey).catch(() => {});
        throw error;
      }

      return json({ ok: true, item }, 201);
    }

    if (method === "DELETE") {
      const id = cleanText(url.searchParams.get("id"), 100);
      if (!id) return json({ error: "ID wajib diisi." }, 400);

      const dataKey = `items/${id}.json`;
      const item = await dataStore.get(dataKey, {
        type: "json",
        consistency: "strong",
      });

      if (!item) return json({ error: "Data tidak ditemukan." }, 404);

      await Promise.all([
        dataStore.delete(dataKey),
        photoStore.delete(item.photoKey || `photos/${id}.jpg`),
      ]);

      return json({ ok: true });
    }

    return json({ error: "Method tidak didukung." }, 405);
  } catch (error) {
    console.error("items function error:", error);
    return json({ error: "Server error: " + (error?.message || "unknown error") }, 500);
  }
};

export const config = {
  path: "/api/items",
};
