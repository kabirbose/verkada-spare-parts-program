import ProductsGrid from "@/components/ProductsGrid";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { SparePart } from "@/models/SparePart";

// Server component: fetches all devices and spare parts from MongoDB,
// then passes them down to the client-side ProductsGrid.
export default async function Page() {
  await dbConnect();

  const [products, parts] = await Promise.all([
    Product.find({}).lean(),
    SparePart.find({}).lean(),
  ]);

  // MongoDB ObjectIds must be serialized to strings before crossing
  // the server → client component boundary.
  const serializedProducts = products.map((p) => ({ ...p, _id: p._id.toString() }));
  const serializedParts    = parts.map((p)    => ({ ...p, _id: p._id.toString() }));

  return (
    <main className="container mx-auto p-8">
      <ProductsGrid
        products={serializedProducts as any}
        spareParts={serializedParts as any}
      />
    </main>
  );
}
