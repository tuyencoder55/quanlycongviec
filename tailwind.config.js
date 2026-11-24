/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme Tailwind/shadcn hiện tại (nối sang bảng màu DESIGN.md qua HSL để giữ hỗ trợ /opacity)
        border: 'hsl(var(--hsl-border))',
        input: 'hsl(var(--hsl-input))',
        ring: 'hsl(var(--hsl-ring))',
        background: 'hsl(var(--hsl-background))',
        foreground: 'hsl(var(--hsl-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--hsl-primary))',
          foreground: 'hsl(var(--hsl-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--hsl-secondary))',
          foreground: 'hsl(var(--hsl-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--hsl-destructive))',
          foreground: 'hsl(var(--hsl-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--hsl-muted))',
          foreground: 'hsl(var(--hsl-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--hsl-accent))',
          foreground: 'hsl(var(--hsl-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--hsl-popover))',
          foreground: 'hsl(var(--hsl-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--hsl-card))',
          foreground: 'hsl(var(--hsl-card-foreground))',
        },

        // Biến màu trực tiếp từ mục 3 của .agent/DESIGN.md
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        row: 'var(--row)',
        'row-hover': 'var(--row-hover)',
        'border-token': 'var(--border)',
        'border-strong': 'var(--border-strong)',
        track: 'var(--track)',
        selected: 'var(--selected)',
        'selected-text': 'var(--selected-text)',
        text: 'var(--text)',
        'muted-text': 'var(--muted)',
        subtle: 'var(--subtle)',
        faint: 'var(--faint)',
        'on-primary': 'var(--on-primary)',

        'ai-bg': 'var(--ai-bg)',
        'ai-border': 'var(--ai-border)',
        'ai-text': 'var(--ai-text)',

        'tag-board-bg': 'var(--tag-board-bg)',
        'tag-board-text': 'var(--tag-board-text)',
        'tag-po-bg': 'var(--tag-po-bg)',
        'tag-po-text': 'var(--tag-po-text)',

        'dot-board': 'var(--dot-board)',
        'dot-mold': 'var(--dot-mold)',
        'dot-po': 'var(--dot-po)',

        'pdf-bg': 'var(--pdf-bg)',
        'pdf-border': 'var(--pdf-border)',
        'pdf-text': 'var(--pdf-text)',

        // Màu bổ trợ giữ tương thích với các component hiện có
        emerald: {
          DEFAULT: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
        },
        indigo: {
          DEFAULT: '#6366f1',
          bg: 'rgba(99, 102, 241, 0.1)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
