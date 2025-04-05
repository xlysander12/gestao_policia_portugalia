import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
    {
        ignores: ["**/*.js"]
    },
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            "prefer-const": "warn",
            "@typescript-eslint/no-non-null-assertion": "off",
            "perfectionist/sort-imports": "warn",

        }
    },
    perfectionist.configs["recommended-natural"]
);