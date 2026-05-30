import { redirect } from "next/navigation";
import { getAdminToken } from "@/app/actions/auth";
import SettingsClient from "./SettingsClient";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/admin/login");
  }

  return (
    <ConvexClientProvider>
      <SettingsClient token={token} />
    </ConvexClientProvider>
  );
}
