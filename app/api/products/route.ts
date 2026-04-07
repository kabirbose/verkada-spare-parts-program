import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Check if product ID already exists
    const existing = await Product.findOne({ _id: body._id });
    if (existing) {
      return NextResponse.json({ error: "Product ID already exists" }, { status: 400 });
    }

    const newProduct = await Product.create(body);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}