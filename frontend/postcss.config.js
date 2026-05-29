export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      '@fullhuman/postcss-purgecss': {
        content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        safelist: {
          standard: [/^mantine-/, /^tiptap-/, /^ProseMirror/],
          deep: [/mantine/, /tiptap/, /ProseMirror/]
        }
      }
    } : {})
  },
}
