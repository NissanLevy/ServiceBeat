import coreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  ...coreWebVitals,
  {
    settings: {
      react: { version: "19" },
    },
  },
];
