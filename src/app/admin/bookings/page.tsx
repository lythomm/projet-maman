import { redirect } from "next/navigation";
import { getAdminToken } from "@/app/actions/auth";
import BookingsClient from "./BookingsClient";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/admin/login");
  }

  return (
    <ConvexClientProvider>
      <BookingsClient token={token} />
    </ConvexClientProvider>
  );
}
