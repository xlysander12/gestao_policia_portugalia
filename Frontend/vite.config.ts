import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {BASE_API_URL, BASE_URL} from "./src/utils/constants";
import compression from "vite-plugin-compression2";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        compression(),
        // analyzer({
        //     openAnalyzer: false,
        //     analyzerMode: "static"
        // }),
        // checker({
        //     typescript: true,
        //     eslint: {
        //         lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
        //         dev: {
        //             logLevel: ["error"]
        //         }
        //     }
        // })
    ],
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
