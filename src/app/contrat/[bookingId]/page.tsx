import { ConvexClientProvider } from "@/app/ConvexClientProvider";
import ContractClient from "./ContractClient";
import { Id } from "@/convex/_generated/dataModel";

interface ContractPageProps {
  params: Promise<{ bookingId: string }>;
}

export const dynamic = "force-dynamic";

export default async function ContractPage({ params }: ContractPageProps) {
  const { bookingId } = await params;

  return (
    <ConvexClientProvider>
      <ContractClient bookingId={bookingId as Id<"bookings">} />
    </ConvexClientProvider>
  );
}
