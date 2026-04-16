import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";

// GET /api/products — return all devices
export async function GET() {
  await dbConnect();
  const products = await Product.find({}).lean();
  return NextResponse.json(products.map((p) => ({ ...p, _id: p._id.toString() })));
}

// POST /api/products — create a new device
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const existing = await Product.findById(body._id);
    if (existing) {
      return NextResponse.json({ error: "Product ID already exists" }, { status: 400 });
    }

    const product = await Product.create(body);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
