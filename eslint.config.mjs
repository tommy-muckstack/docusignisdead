import parser from "@typescript-eslint/parser";
import hooks from "eslint-plugin-react-hooks";
export default [{ ignores: [".next/**", "node_modules/**", "vendor/**"] }, {
  files: ["**/*.ts", "**/*.tsx"],
  languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
  plugins: { "react-hooks": hooks },
  rules: { "react-hooks/rules-of-hooks": "error", "no-debugger": "error", "no-constant-condition": "error", "no-duplicate-case": "error", "no-unsafe-finally": "error", "no-unreachable": "error", "constructor-super": "error", "valid-typeof": "error" }
}];
