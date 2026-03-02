import { HistoryClient } from "@/components/mood/HistoryClient";
import { AuthGate } from "@/components/auth/AuthGate";

export default function HistoryPage() {
  return (
    <AuthGate
      title="História je viazaná na účet"
      description="Lokálny demo režim je fajn, ale história a trendy dávajú zmysel až keď je to syncnuté do účtu."
    >
      <div className="space-y-4">
        <h1 className="text-lg font-semibold tracking-tight">História</h1>
        <HistoryClient />
      </div>
    </AuthGate>
  );
}
