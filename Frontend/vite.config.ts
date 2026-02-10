import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  console.log('--------------------------------------------------');
  console.log(' TARGET URL:', env.VITE_API_ENDPOINT); 
  console.log('--------------------------------------------------');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api-tidb': {
          target: env.VITE_API_ENDPOINT,
          changeOrigin: true,
          secure: false, 
          rewrite: (path) => path.replace(/^\/api-tidb/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log(' Proxy Error:', err);
            });
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(' Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  }
})