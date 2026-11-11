import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        bg: '#0b0e11',
        panel: '#161a1e',
        panel2: '#1c2128',
        borderp: '#2b3139',
        textp: '#eaecef',
        sub: '#848e9c',
        accent: '#3772ff',
        long: '#0ecb81',
        short: '#f6465d',
        gold: '#f0b90b',
        waai: '#202c33',
        wau: '#005c4b'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    }
  }
}
