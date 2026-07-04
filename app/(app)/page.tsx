import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      }
    >
      <Dashboard />
    </Suspense>
  );
}
