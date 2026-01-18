import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("home", "zh");

export default function HomePageZh() {
  return <HomeClient lang="zh" />;
}
