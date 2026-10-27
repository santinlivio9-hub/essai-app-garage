// Tailwind est compilé en un fichier statique (css/tailwind.css) versionné :
// aucune dépendance réseau au lancement, la PWA fonctionne hors-ligne.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        accent: 'var(--accent)',
        hud: 'var(--hud)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
