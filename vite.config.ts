import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CA.RO Clinic | Dra. Mariah Zibetti',
        short_name: 'Dra Mariah',
        description: 'Portal do Paciente - Dermatologia e Tricologia Avançada',
        theme_color: '#FAFAFA',
        background_color: '#FAFAFA',
        display: 'standalone',
        icons: [
          {
            src: 'https://images.unsplash.com/photo-1605902302613-255d6541f531?auto=format&fit=crop&w=192&h=192',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://images.unsplash.com/photo-1605902302613-255d6541f531?auto=format&fit=crop&w=512&h=512',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
