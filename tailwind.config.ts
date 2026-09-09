import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        /* DELIBERATELY NOT REGISTERED: neon-green / deep-black / dark-gray / medium-gray.
         *
         * Registering them here was tried and reverted. It works — but it is not safe for
         * this migration, and the reason is worth recording so nobody "fixes" it again
         * without meaning to.
         *
         * index.css defines `.bg-neon-green`, `.bg-deep-black`, `.bg-dark-gray` and
         * `.bg-medium-gray` as hand-written `@layer components` rules. Those four work.
         * Every OTHER variant the codebase spells — `text-neon-green`,
         * `border-neon-green`, `hover:border-neon-green`, `shadow-neon-green/20`,
         * `text-deep-black`, `border-medium-gray` — has always generated no CSS at all.
         * That is verifiable in the deployed stylesheet: `.text-neon-green` does not
         * appear in assets/index-B5GcQq1H.css.
         *
         * Registering the colour family activates all of them AT ONCE, across 13 files
         * that are nothing to do with the redesign — the whole admin area
         * (admin-dashboard, admin-service-form, admin-login, admin-whatsapp), the booking
         * confirmation page, contact, the three legal pages, navbar and footer. That is
         * ~150 class occurrences changing colour simultaneously, with no way to review
         * them as part of a frontend migration.
         *
         * So the redesigned components use the CSS variables directly instead
         * (`text-[var(--neon-green)]`), which is scoped to the components that intend it
         * and leaves every other page rendering exactly as production does today.
         *
         * Turning these on is a reasonable follow-up — the classes were clearly written
         * meaning green — but it is a deliberate visual change to the admin and legal
         * pages and belongs in its own reviewed change, not in this one. */
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
