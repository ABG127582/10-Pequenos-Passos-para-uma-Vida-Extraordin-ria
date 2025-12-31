import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
    const env = loadEnv(mode, '.', '');

    return {
      plugins: [basicSsl()],
      define: {
        // Standardize on using API_KEY from the environment.
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, './')
        }
      }
    };
});