import { redirect } from "next/navigation";
import { getAdminToken } from "@/app/actions/auth";
import DashboardClient from "./DashboardClient";
import { ConvexClientProvider } from "../ConvexClientProvider";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = await getAdminToken();

  // If no token (should be caught by middleware), redirect to login
  if (!token) {
    redirect("/admin/login");
  }

  return (
    <ConvexClientProvider>
      <DashboardClient token={token} />
    </ConvexClientProvider>
  );
}
