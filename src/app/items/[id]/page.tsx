import ItemDetailClient from "./ItemDetailClient";
import { ConvexClientProvider } from "../../ConvexClientProvider";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <ConvexClientProvider>
      <ItemDetailClient itemId={id} />
    </ConvexClientProvider>
  );
}
