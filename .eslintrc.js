module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
    es6: true,
    browser: true,
  },
  globals: {
    console: 'readonly',
    process: 'readonly',
    require: 'readonly',
    module: 'readonly',
    exports: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    global: 'readonly',
    Buffer: 'readonly',
  },
  rules: {
    'no-console': 'off',
    'no-undef': 'off',
  },
  overrides: [
    {
      files: ['*.js'],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        node: true,
      },
    },
    {
      files: ['functions/edge/**/*.ts'],
      env: {
        browser: false,
        node: false,
      },
      globals: {
        Deno: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
  ],
};
