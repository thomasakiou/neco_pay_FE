// import path from 'path';
// import { defineConfig, loadEnv } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, '.', '');
//   return {
//     server: {
//       port: 3000,
//       host: '0.0.0.0',
//       proxy: {
//         '/auth': {
//           target: 'http://localhost:8000',
//           changeOrigin: true,
//         },
//         '/staff': {
//           target: 'http://localhost:8000',
//           changeOrigin: true,
//         },
//         '/banks': {
//           target: 'http://localhost:8000',
//           changeOrigin: true,
//         },
//         '/distances': {
//           target: 'http://localhost:8000',
//           changeOrigin: true,
//         },
//         '/parameters': {
//           target: 'http://localhost:8000',
//           changeOrigin: true,
//         },
//         '/postings': {
//           target: 'http://localhost:8000',
//           changeOrigin: true,
//         },
//         '/payments': {
//           target: 'http://localhost:8000',
//           changeOrigin: true,
//         },
//         '/states': {
//           target: 'http://localhost:8000',
//           changeOrigin: true,
//         }
//       }
//     },
//     plugins: [react()],
//     define: {
//       'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
//       'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
//     },
//     resolve: {
//       alias: {
//         '@': path.resolve(__dirname, '.'),
//       }
//     }
//   };
// });


import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['necopay.local'], // <--- add this
      proxy: {
        '/auth': {
          // target: 'http://localhost:8000',
          target: 'http://10.0.0.65:8000',
          changeOrigin: true,
        },
        '/staff': {
          target: 'http://10.0.0.65:8000',
          changeOrigin: true,
        },
        '/banks': {
          target: 'http://10.0.0.65:8000',
          changeOrigin: true,
        },
        '/distances': {
          target: 'http://10.0.0.65:8000',
          changeOrigin: true,
        },
        '/parameters': {
          target: 'http://10.0.0.65:8000',
          changeOrigin: true,
        },
        '/postings': {
          target: 'http://10.0.0.65:8000',
          changeOrigin: true,
        },
        '/payments': {
          target: 'http://10.0.0.65:8000',
          changeOrigin: true,
        },
        '/states': {
          target: 'http://10.0.0.65:8000',
          changeOrigin: true,
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

