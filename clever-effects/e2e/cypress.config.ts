import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'nx run clever-effects:serve:development',
        production: 'nx run clever-effects:serve:production',
      },
      ciWebServerCommand: 'nx run clever-effects:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
  },
});
