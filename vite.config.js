import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import handleLocalApi from './scripts/localApi.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/api/')) {
            handleLocalApi(req, res).catch(err => {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 5173
  }
})
