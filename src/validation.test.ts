import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema validating typical login payloads
const loginSchema = z.object({
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits").max(15),
  password: z.string().min(6, "Password must be at least 6 characters")
});

describe('Zod Input Validation', () => {
  it('should successfully parse a valid payload', () => {
    const result = loginSchema.safeParse({
      mobileNumber: "9876543210",
      password: "admin123"
    });
    expect(result.success).toBe(true);
  });

  it('should fail to parse if mobileNumber is too short', () => {
    const result = loginSchema.safeParse({
      mobileNumber: "123",
      password: "password123"
    });
    expect(result.success).toBe(false);
  });
});
