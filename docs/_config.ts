import lume from "https://deno.land/x/lume/mod.ts";
import mdx from "https://deno.land/x/lume/plugins/mdx.ts";
import prism from "https://deno.land/x/lume/plugins/prism.ts";
import pagefind from "https://deno.land/x/lume/plugins/pagefind.ts";
import multilanguage from "https://deno.land/x/lume/plugins/multilanguage.ts";
import katex from "https://deno.land/x/lume/plugins/katex.ts";

export default lume()
  .use(mdx())
  .use(prism())
  .use(pagefind({
    ui: { containerId: "search", resetStyles: true },
  }))
  .use(multilanguage({ languages: ["en"] }))
  .use(katex());
