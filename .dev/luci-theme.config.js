// Theme identity read by the Vite build (vite.config.ts) and the devkit dev
// layer / bins (@eamonxg/luci-theme-devkit). Everything theme-specific lives
// here; the machinery is generic.
export default {
  name: "outline", // media dir (/luci-static/outline) + ucode theme dir
  css: ["main", "login"], // src/media/<e>.css → /luci-static/outline/<e>.css
  resources: ["menu-outline", "sidebar-outline"], // served at /luci-static/resources/<m>.js in dev
  assets: { dir: "public/outline", only: /^icons\/[^/]+\.svg$/ }, // only icons served in dev
  patchAliases: {},
};
