import ClientHome from "./ClientHome";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <ConvexClientProvider>
      <ClientHome />
    </ConvexClientProvider>
  );
}
