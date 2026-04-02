export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtExpiresIn: "24h",
  nodeEnv: process.env.NODE_ENV || "development",
} as const;
