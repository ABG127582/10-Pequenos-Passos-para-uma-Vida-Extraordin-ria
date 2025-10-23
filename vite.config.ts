import path from 'path';
import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
    const env = loadEnv(mode, '.', '');

    return {
      base: '/10-Pequenos-Passos-para-uma-Vida-Extraordin-ria/',
      plugins: [basicSsl()],
      define: {
        // Standardize on using API_KEY from the environment.
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve('./'),
        }
      }
    };
});