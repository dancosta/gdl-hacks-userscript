import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  pluginJs.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,      // Reconhece comandos do navegador (document, window)
        ...globals.greasemonkey, // Reconhece comandos do Tampermonkey (GM_setValue, etc)
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
];