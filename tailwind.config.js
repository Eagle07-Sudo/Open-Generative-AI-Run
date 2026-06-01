/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./packages/studio/src/**/*.{js,jsx}",
        "./packages/Open-AI-Design-Agent/packages/design-agent/src/**/*.{js,jsx}",
        "./packages/Open-Poe-AI/packages/agents/src/**/*.{js,jsx,ts,tsx}",
        "./packages/Vibe-Workflow/packages/workflow-builder/src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                },
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    hover: 'var(--color-accent-hover)',
                },
                danger: 'var(--color-danger)',
                'app-bg': 'var(--bg-app)',
                'panel-bg': 'var(--bg-panel)',
                'card-bg': 'var(--bg-card)',
                foreground: 'var(--text-primary)',
                'foreground-secondary': 'var(--text-secondary)',
                'foreground-muted': 'var(--text-muted)',
                'border-subtle': 'var(--border-light)',
                'surface-input': 'var(--bg-card)',
                secondary: 'var(--text-secondary)',
                muted: 'var(--text-muted)',
            },
            fontFamily: {
                sans: ['var(--font-family)'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            boxShadow: {
                'glow': 'var(--shadow-glow)',
                'glow-accent': 'var(--shadow-glow-accent)',
                '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.8)',
            }
        },
    },
    plugins: [],
}
