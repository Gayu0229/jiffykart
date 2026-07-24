/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#505081',
                secondary: '#10B981',
                dark: '#0F0E47',
                light: '#F3F4F6',
                accent: '#8686AC',
            }
        },
    },
    plugins: [],
}
