// Centralized, pinned dependencies for the docs build (Lume + plugins)
// Keep versions aligned with the CLI used in deno tasks.

export { default as lume } from "https://deno.land/x/lume@v3.0.6/mod.ts";
export { default as mdx } from "https://deno.land/x/lume@v3.0.6/plugins/mdx.ts";
export { default as prism } from "https://deno.land/x/lume@v3.0.6/plugins/prism.ts";
export { default as pagefind } from "https://deno.land/x/lume@v3.0.6/plugins/pagefind.ts";
export { default as multilanguage } from "https://deno.land/x/lume@v3.0.6/plugins/multilanguage.ts";
export { default as katex } from "https://deno.land/x/lume@v3.0.6/plugins/katex.ts";
