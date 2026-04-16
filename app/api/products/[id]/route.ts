import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";

type Params = { params: Promise<{ id: string }> };

// GET /api/products/[id] — fetch a single device (used by the edit form)
export async function GET(_req: Request, { params }: Params) {
  await dbConnect();
  const { id } = await params;

  const product = await Product.findById(id);
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PUT /api/products/[id] — update an existing device
export async function PUT(request: Request, { params }: Params) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  const updated = await Product.findByIdAndUpdate(id, body, { new: true });
  if (!updated) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/products/[id] — permanently delete a device
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
