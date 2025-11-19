import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
    ],
    server: {
        host: 'localhost',
        port: 5173, // puerto donde corre Vite
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8080', // tu backend Laravel
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
