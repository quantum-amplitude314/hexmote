import { LiveCanvas } from "@/components/live-canvas";

export default function HomePage() {
  return (
    <main className="grid content-start justify-items-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Hexmote</h1>
      <LiveCanvas />
    </main>
  );
}
