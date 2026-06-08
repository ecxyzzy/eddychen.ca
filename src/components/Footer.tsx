import type { FC } from "hono/jsx";

const firstYear = 2025;

export const Footer: FC = () => (
  <div class="centre-flex">
    <footer style="margin: 1.25rem">
      Copyright (c) {`${firstYear}–${new Date().getFullYear()}`} Eddy Chen. Made with{" "}
      <a href="https://hono.dev/">Hono</a> and 💖 in 🇨🇦
    </footer>
  </div>
);
