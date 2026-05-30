import CheckoutClient from "./CheckoutClient";
import { ConvexClientProvider } from "../ConvexClientProvider";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <ConvexClientProvider>
      <CheckoutClient />
    </ConvexClientProvider>
  );
}
