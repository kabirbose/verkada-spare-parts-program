import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb"; 
import { Product } from "@/models/Product"; 

export async function DELETE(
  request: Request,
  // 1. Update the type to explicitly say params is a Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // 2. THIS IS THE FIX: You must 'await' the params object!
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting product from database:", error);
    
    return NextResponse.json(
      { message: "An error occurred while deleting the product" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const product = await Product.findById(id);
  return NextResponse.json(product || {}, { status: product ? 200 : 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const updated = await Product.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(updated);
}