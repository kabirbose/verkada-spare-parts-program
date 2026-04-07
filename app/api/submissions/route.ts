import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Submission } from "@/models/Submission";
import { Cart } from "@/models/Cart";

// GET /api/submissions — fetch all orders, newest first
export async function GET() {
  await dbConnect();
  const submissions = await Submission.find().sort({ createdAt: -1 }).lean();
  const serialized = submissions.map((s) => ({ ...s, _id: s._id.toString() }));
  return NextResponse.json(serialized);
}

const CART_ID = "main";

// POST /api/submissions — save submission and clear cart
export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();

  const { supportEngineerName, caseNumber, companyName, customerAddress, attentionTo, shippingMethod, contactInfo, notes, items } = body;

  if (!supportEngineerName || !caseNumber || !companyName || !customerAddress || !attentionTo || !shippingMethod || !contactInfo) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  await Submission.create({ supportEngineerName, caseNumber, companyName, customerAddress, attentionTo, shippingMethod, contactInfo, notes, items });

  // Clear the cart after successful submission
  const cart = await Cart.findById(CART_ID);
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
