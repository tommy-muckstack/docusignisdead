import type { MetadataRoute } from "next";
import { BP } from "@/lib/basepath";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "DocuSignIsDead", short_name: "DocuSignIsDead", description: "Prepare, sign and track your agreements.", start_url: `${BP}/`, scope: `${BP}/`, display: "standalone", background_color: "#ffffff", theme_color: "#4c00ff", icons: [{ src: `${BP}/brand/icon-192.png`, sizes: "192x192", type: "image/png" }, { src: `${BP}/brand/icon-512.png`, sizes: "512x512", type: "image/png" }] };
}
