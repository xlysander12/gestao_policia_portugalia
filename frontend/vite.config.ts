import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {BASE_API_URL, BASE_URL} from "./src/utils/constants";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: BASE_URL,
    server: {
        proxy: {
            [BASE_API_URL]: {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
})
