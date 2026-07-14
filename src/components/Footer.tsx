import type { FC } from "hono/jsx";

export const Footer: FC = () => (
  <div class="centre-flex">
    <footer style="margin: 1.25rem">
      Copyright (c) {`2025–${new Date().getFullYear()}`} Eddy Chen. Made with{" "}
      <a href="https://hono.dev/">Hono</a> and 💖 in 🇨🇦
    </footer>
  </div>
);
