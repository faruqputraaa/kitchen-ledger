import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(100),

  email: z
    .email()
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8)
    .max(100),
});

export const loginSchema = z.object({
  email: z
    .email()
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1),
});