import { z } from 'zod'

export const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.url().startsWith('postgresql://'),
  DATABASE_SCHEMA: z.string().default('public'),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  AWS_ACCESS_KEY_ID: z.string().default('test'),
  AWS_SECRET_ACCESS_KEY: z.string().default('test'),
  AWS_REGION: z.string().default('us-east-2'),
  AWS_S3_BUCKET: z.string().default('fast-feet-bucket'),
  AWS_ENDPOINT: z.string().optional().default('http://localhost:4566'),
})

export type Env = z.infer<typeof envSchema>
