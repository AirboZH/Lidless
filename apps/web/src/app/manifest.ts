import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lidless",
    short_name: "Lidless",
    description: "Keep your Mac awake while it's locked.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1022",
    theme_color: "#0b1022",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
