import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import stylistic from "@stylistic/eslint-plugin"


/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/indent": ["error", 2],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/array-element-newline": ["error", { minItems: 3 }],
      "@stylistic/array-bracket-newline": ["error", { multiline: true }],
      "@stylistic/curly-newline": [
        "error", {
          consistent: true, minElements: 4 
        }
      ],
      "@stylistic/object-curly-newline": [
        "error", {
          consistent: true, minProperties: 2 
        }
      ],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/eol-last": "error",
      "@stylistic/implicit-arrow-linebreak": ["error", "below"],
      "@stylistic/brace-style": "error",
      "@stylistic/arrow-parens": "error",
      "@stylistic/arrow-spacing": "error",
      "@stylistic/semi": ["error", "never"],
      "@stylistic/max-statements-per-line": "error",
    } 
  }
]
