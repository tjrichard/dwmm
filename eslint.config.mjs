export default [
  {
    ignores: [
      ".next/**",
      ".playwright-cli/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      "*.config.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        Buffer: "readonly",
        console: "readonly",
        CustomEvent: "readonly",
        document: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        localStorage: "readonly",
        module: "readonly",
        process: "readonly",
        React: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        window: "readonly",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
];
