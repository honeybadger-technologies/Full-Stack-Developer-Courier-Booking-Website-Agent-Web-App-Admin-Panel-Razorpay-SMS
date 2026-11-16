const { nxE2EPreset } = require('@nx/cypress/plugins/cypress-preset');
const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      "cypressDir": "src",
      "webServerCommands": {
        "default": process.env['CI'] ? 'npx nx run admin:start' : 'npx nx run admin:dev'
      },
      "ciWebServerCommand": "npx nx run admin:start",
      "ciBaseUrl": "http://localhost:3000"
    }),
    baseUrl: process.env['CI'] ? 'http://localhost:3000' : 'http://127.0.0.1:3000',
  },
});
