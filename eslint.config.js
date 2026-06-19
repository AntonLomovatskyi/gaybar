// Flat ESLint config: Expo's rules + Prettier compatibility.
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = [
  ...expoConfig,
  eslintConfigPrettier,
  {
    ignores: [
      "dist/*",
      ".expo/*",
      "web-build/*",
      "node_modules/*",
      ".work/*",
      "src/data/generated/*",
      "recipes/**",
      "scripts/**",
    ],
  },
];
