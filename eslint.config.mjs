import globals from "globals";

export default [{
    files: [
        "extension.js",
        //"test/extension.test.js",
    ],
    ignores: [
        ".vscode-test-web/",
        "dist/",
        "**/*-unused.js",
    ],
    languageOptions: {
        globals: {
            ...globals.commonjs,
            ...globals.node,
            ...globals.mocha,
        },

        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "no-const-assign": "warn",
        "no-this-before-super": "warn",
        "no-undef": "warn",
        "no-unreachable": "warn",
        "no-unused-vars": "warn",
        "constructor-super": "warn",
        "valid-typeof": "warn",
    },
}];