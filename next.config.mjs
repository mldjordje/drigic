/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.drigic.rs",
          },
        ],
        destination: "https://drigic.rs/:path*",
        permanent: true,
      },
      // Uklonjene demo/template stranice — 301 na relevantan sadržaj
      { source: "/home-:num", destination: "/", permanent: true },
      { source: "/about", destination: "/nikola-igic", permanent: true },
      { source: "/pricing", destination: "/cenovnik", permanent: true },
      { source: "/project", destination: "/rezultati", permanent: true },
      { source: "/project-:num", destination: "/rezultati", permanent: true },
      { source: "/project-details/:id", destination: "/rezultati", permanent: true },
      { source: "/service", destination: "/tretmani", permanent: true },
      { source: "/service-:num", destination: "/tretmani", permanent: true },
      { source: "/service-details/:id", destination: "/tretmani", permanent: true },
      { source: "/team", destination: "/nikola-igic", permanent: true },
      { source: "/team-details/:id", destination: "/nikola-igic", permanent: true },
      { source: "/blog-2", destination: "/blog", permanent: true },
      { source: "/shop", destination: "/", permanent: true },
      { source: "/shop-details/:id", destination: "/", permanent: true },
      { source: "/cart", destination: "/", permanent: true },
      { source: "/checkout", destination: "/", permanent: true },
      { source: "/error", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?<host>.*\\.vercel\\.app)",
          },
        ],
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  sassOptions: {
    quietDeps: true, // This will silence deprecation warnings
    silenceDeprecations: [
      "import",
      "global-builtin",
      "color-functions",
      "slash-div",
      "mixed-decls",
      "abs-percent",
      "function-units",
      "strict-unary",
      "legacy-js-api",
    ],
  },
};

export default nextConfig;
