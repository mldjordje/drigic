export default function manifest() {
  return {
    name: "Dr Igić App",
    short_name: "Dr Igić",
    description: "Online zakazivanje i upravljanje tretmanima klinike estetske medicine.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0C00",
    theme_color: "#0A0C00",
    lang: "sr-RS",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}

