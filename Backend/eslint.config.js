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
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/dot-notation": "warn",
            "@typescript-eslint/no-unnecessary-type-assertion": "warn",
            "@typescript-eslint/no-inferrable-types": "warn",
            "@typescript-eslint/prefer-nullish-coalescing": "warn",
            "@typescript-eslint/prefer-for-of": "warn",
            "no-control-regex": "off",
            "@typescript-eslint/no-floating-promises": "warn"
            // "perfectionist/sort-imports": "warn",
            // "perfectionist/sort-objects": "off",

        }
    },
    // perfectionist.configs["recommended-natural"]
);