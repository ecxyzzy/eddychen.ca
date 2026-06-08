import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";

import { Footer } from "@/components/Footer";

declare module "hono" {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { pageTitle?: string }): Response;
  }
}

export const renderer = jsxRenderer(({ children, pageTitle }) => (
  <html lang="en">
    <head>
      <ViteClient />
      <Link href="/src/styles/global.css" rel="stylesheet" />
      <meta charset="utf-8" />
      <link rel="icon" type="image/png" href="/favicon.ico" />
      <meta name="viewport" content="width=device-width" />
      <title>{pageTitle ?? "Eddy Chen"}</title>
    </head>
    <body>
      <div class="centre-flex">
        <div style="max-width: 50rem;">{children}</div>
      </div>
      <Footer />
    </body>
  </html>
));
