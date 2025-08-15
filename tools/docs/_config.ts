import { lume, mdx, prism, pagefind, multilanguage, katex } from "./deps.ts";

export default lume()
  .use(mdx())
  .use(prism())
  .use(pagefind({
    ui: { containerId: "search", resetStyles: true },
  }))
  .use(multilanguage({ languages: ["en"] }))
  .use(katex());
