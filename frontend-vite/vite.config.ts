import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {base_api_url, base_url} from "./src/utils/constants";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: base_url,
    server: {
        proxy: {
            [base_api_url]: {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
})
