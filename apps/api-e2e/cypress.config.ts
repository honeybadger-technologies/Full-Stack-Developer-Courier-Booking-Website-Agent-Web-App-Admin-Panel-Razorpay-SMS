const { nxE2EPreset } = require('@nx/cypress/plugins/cypress-preset');
const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      "cypressDir": "src",
      "webServerCommands": {
        "default": process.env['CI'] ? 'npx nx run api:start --port=3001' : 'npx nx run api:dev --port=3001'
      },
      "ciWebServerCommand": "npx nx run api:start --port=3001",
      "ciBaseUrl": "http://localhost:3000"
    }),
    baseUrl: process.env['CI'] ? 'http://localhost:3000' : 'http://127.0.0.1:3000',
  },
});
