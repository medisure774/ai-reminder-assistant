/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neon: {
                    cyan: "#00f3ff",
                    purple: "#bc13fe",
                    dark: "#0a0a12"
                }
            }
        },
    },
    plugins: [],
}
