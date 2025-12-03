/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
                'bg-secondary': 'rgb(var(--bg-secondary) / <alpha-value>)',
                'bg-tertiary': 'rgb(var(--bg-tertiary) / <alpha-value>)',

                'accent-primary': 'rgb(var(--accent-primary) / <alpha-value>)',
                'accent-secondary': 'rgb(var(--accent-secondary) / <alpha-value>)',
                'accent-glow': 'var(--accent-glow)',

                'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
                'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
                'text-tertiary': 'rgb(var(--text-tertiary) / <alpha-value>)',

                'border-color': 'var(--border-color)',
                'glass-bg': 'var(--glass-bg)',
                'glass-border': 'var(--glass-border)',

                success: 'rgb(var(--success) / <alpha-value>)',
                warning: 'rgb(var(--warning) / <alpha-value>)',
                danger: 'rgb(var(--danger) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
