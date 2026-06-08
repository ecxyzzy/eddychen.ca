import { Hono } from "hono";

import { renderer } from "@/lib/renderer";
import { blogRoutes } from "@/routes/blog";
import { privateRoutes } from "@/routes/private";
import { rssRoute } from "@/routes/rss";
import { staticRoutes } from "@/routes/static";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);
app.route("/", staticRoutes);
app.route("/", rssRoute);
app.route("/blog", blogRoutes);
app.route("/private", privateRoutes);

export default app;
