import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {BASE_API_URL, BASE_URL, BASE_WS_URL} from "./src/utils/constants";
import compression from "vite-plugin-compression2";
import * as path from "node:path";

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
    resolve: {
      alias: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          "@portalseguranca/api-types": path.resolve(__dirname, "../API-Types/src"),
      }
    },
    base: BASE_URL,
    server: {
        proxy: {
            [`${BASE_URL}/manual`]: {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
            [`${BASE_URL}/titles`]: {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
            [BASE_API_URL]: {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
            [BASE_WS_URL]: {
                target: 'ws://localhost:8080',
                ws: true,
                changeOrigin: true,
                secure: false
            }
        }
    }
})
