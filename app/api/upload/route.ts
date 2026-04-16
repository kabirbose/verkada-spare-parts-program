// NOTE: This route is kept for potential future use (e.g. direct URL upload from
// external tools), but the UI currently converts images to base64 data URLs
// client-side via FileReader, so this endpoint is not called during normal use.

import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

// POST /api/upload — accept a file upload and save it under /public/uploads/
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate a collision-resistant filename while preserving the file extension
    const ext      = path.extname(file.name).toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const dest     = path.join(process.cwd(), "public", "uploads", filename);

    await writeFile(dest, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
