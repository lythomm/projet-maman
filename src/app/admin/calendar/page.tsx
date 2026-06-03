import { redirect } from "next/navigation";
import { getAdminToken } from "@/app/actions/auth";
import CalendarClient from "./CalendarClient";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/admin/login");
  }

  return (
    <ConvexClientProvider>
      <CalendarClient token={token} />
    </ConvexClientProvider>
  );
}
