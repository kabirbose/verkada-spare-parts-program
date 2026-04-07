import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SparePart } from "@/models/SparePart";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Check if part ID already exists
    const existing = await SparePart.findOne({ _id: body._id });
    if (existing) {
      return NextResponse.json({ error: "Part ID already exists" }, { status: 400 });
    }

    const newPart = await SparePart.create(body);
    return NextResponse.json({ success: true, part: newPart }, { status: 201 });
  } catch (error) {
    console.error("Error creating part:", error);
    return NextResponse.json({ error: "Failed to create part" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const part = await SparePart.findById(id);
  return NextResponse.json(part || {}, { status: part ? 200 : 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const updated = await SparePart.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(updated);
}