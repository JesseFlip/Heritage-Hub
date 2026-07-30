import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: ["prototype/**", "guides/**"],
  },
];

export default config;
