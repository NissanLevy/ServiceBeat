import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ServiceBeat",
    short_name: "ServiceBeat",
    description: "API Health Monitor",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#030712",
    icons: [
      { src: "/servicebeat-pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/servicebeat-pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
