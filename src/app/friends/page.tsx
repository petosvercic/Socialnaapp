import { FriendsClient } from "@/components/friends/FriendsClient";
import { AuthGate } from "@/components/auth/AuthGate";

export default function FriendsPage() {
  return (
    <AuthGate title="Priatelia" description="Priatelia nie sú verejný billboard. Najprv sa prihlás, potom sa socializuj.">
      <FriendsClient />
    </AuthGate>
  );
}
