import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SparePart } from "@/models/SparePart";

type Params = { params: Promise<{ id: string }> };

// GET /api/parts/[id] — fetch a single spare part (used by the edit form)
export async function GET(_req: Request, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const part = await SparePart.findById(id);
    if (!part) {
      return NextResponse.json({ message: "Part not found" }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error) {
    console.error("Error fetching part:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// PUT /api/parts/[id] — update an existing spare part
export async function PUT(request: Request, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updated = await SparePart.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ message: "Part not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating part:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/parts/[id] — permanently delete a spare part
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await SparePart.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Part not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Part deleted successfully" });
  } catch (error) {
    console.error("Error deleting part:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
