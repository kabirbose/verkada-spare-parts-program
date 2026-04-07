import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SparePart } from "@/models/SparePart"; 

// --- GET: Fetch a single part to populate the Edit Form ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const part = await SparePart.findById(id);
    
    if (!part) {
      return NextResponse.json({ message: "Part not found" }, { status: 404 });
    }
    
    return NextResponse.json(part, { status: 200 });
  } catch (error) {
    console.error("Error fetching part:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// --- PUT: Save edits made in the Edit Form ---
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    const updatedPart = await SparePart.findByIdAndUpdate(id, body, { new: true });
    
    if (!updatedPart) {
      return NextResponse.json({ message: "Part not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPart, { status: 200 });
  } catch (error) {
    console.error("Error updating part:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// --- DELETE: Delete a part (Your existing code) ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "Part ID is required" }, { status: 400 });
    }

    const deletedPart = await SparePart.findByIdAndDelete(id);

    if (!deletedPart) {
      return NextResponse.json({ message: "Part not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Part deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting part from database:", error);
    return NextResponse.json({ message: "An error occurred while deleting the part" }, { status: 500 });
  }
}