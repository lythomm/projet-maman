import { redirect } from "next/navigation";
import { getAdminToken } from "@/app/actions/auth";
import DashboardOverviewClient from "./DashboardOverviewClient";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/admin/login");
  }

  return (
    <ConvexClientProvider>
      <DashboardOverviewClient token={token} />
    </ConvexClientProvider>
  );
}
