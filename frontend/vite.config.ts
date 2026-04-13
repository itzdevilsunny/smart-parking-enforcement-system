import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'https://smart-parking-backend-1p4n.onrender.com',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'https://smart-parking-backend-1p4n.onrender.com',
                ws: true,
                changeOrigin: true
            }
        }
    }
})
