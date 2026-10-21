import type { Metadata } from "next";
import Link from "next/link";
import { AdminPanel } from "@/components/admin-panel";

export const metadata: Metadata = {
  title: "Hexmote admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="grid content-start justify-items-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Hexmote admin</h1>
      <AdminPanel />
      <Link href="/" className="text-sm underline underline-offset-4">
        Back to the canvas
      </Link>
    </main>
  );
}
