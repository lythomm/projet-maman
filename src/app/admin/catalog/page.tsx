import { redirect } from "next/navigation";
import { getAdminToken } from "@/app/actions/auth";
import CatalogClient from "./CatalogClient";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/admin/login");
  }

  return (
    <ConvexClientProvider>
      <CatalogClient token={token} />
    </ConvexClientProvider>
  );
}
