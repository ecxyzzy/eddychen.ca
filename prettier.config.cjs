module.exports = {
  plugins: ["prettier-plugin-packagejson", "prettier-plugin-astro"],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
        printWidth: 100,
      },
    },
  ],
};
