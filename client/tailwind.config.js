/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        yellowgreen: {
          100: "#C6F300",
          200: "#D6F5C9",
          300: "#B8EDA4",
          400: "#9DC209",
          500: "#8CAD08",
          600: "#7B9807",
          900: "#2A3B00",
        },
        gray: {
          800: "#1F2937",
          900: "#111827",
        },
        superyellowgreen: {
          100: "#BCF549",
        },
      },
      boxShadow: {
        glow: "0 0 15px rgba(157, 194, 9, 0.2)",
      },
      keyframes: {
        slideIn: {
          "0%": {
            transform: "translateX(-100px) rotate(-2deg)",
            opacity: "0",
            backgroundColor: "rgba(157, 194, 9, 0.2)",
          },
          "20%": {
            transform: "translateX(-50px) rotate(2deg)",
            opacity: "0.3",
            backgroundColor: "rgba(157, 194, 9, 0.3)",
          },
          "40%": {
            transform: "translateX(-25px) rotate(-1deg)",
            opacity: "0.6",
            backgroundColor: "rgba(157, 194, 9, 0.4)",
          },
          "60%": {
            transform: "translateX(-10px) rotate(1deg)",
            opacity: "0.8",
            backgroundColor: "rgba(157, 194, 9, 0.3)",
          },
          "80%": {
            transform: "translateX(-5px) rotate(-0.5deg)",
            opacity: "0.9",
            backgroundColor: "rgba(157, 194, 9, 0.2)",
          },
          "100%": {
            transform: "translateX(0) rotate(0)",
            opacity: "1",
            backgroundColor: "transparent",
          },
        },
      },
      animation: {
        slideIn: "slideIn 0.5s cubic-bezier(0.36, 0, 0.66, -0.56)",
      },
      borderRadius: {
        "4xl": "50px",
      },
      listStyleType: {
        square: "square",
        "lower-roman": "lower-roman",
      },
    },
  },
  plugins: [],
};
