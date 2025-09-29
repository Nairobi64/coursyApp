module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: [".functions/tsconfig.json"],
    "tsconfigRootDir": __dirname,
  "sourceType": "module"
  },
 ignorePatterns: [
  "/lib/**/*", // Ignore built files.
  "/generated/**/*", // Ignore generated files.
  ".eslintrc.js",    // Ignore this config file.
],
  plugins: ["@typescript-eslint","import",],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    rules: {
  "@typescript-eslint/no-namespace": "off",
  "@typescript-eslint/no-var-requires": "off"
},
};
