export function validateEnv() {
  const requiredEnvVars = ["URI", "JWT_SECRET"]
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} is not defined in the environment variables`)
    }
  }
}

