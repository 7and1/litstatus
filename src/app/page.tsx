import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildPageMetadata } from "@/lib/seo";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = buildPageMetadata("home", "en");

// Dynamic import with code splitting for better performance
const HomeClient = dynamic(() => import("@/components/HomeClient").then(mod => ({ default: mod.default })), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0b0f]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2ceef0] border-t-transparent" />
    </div>
  ),
  ssr: true,
});

export default function HomePage() {
  return (
    <ErrorBoundary>
      <HomeClient lang="en" />
    </ErrorBoundary>
  );
}
