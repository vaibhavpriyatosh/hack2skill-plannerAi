import { describe, expect, it } from "vitest";
import { sanitizeText } from "@/lib/validation/sanitize";

describe("sanitizeText", () => {
  it("removes control characters and trims whitespace", () => {
    expect(sanitizeText("  Alex\u0007\n ")).toBe("Alex");
  });

  it("keeps readable content unchanged", () => {
    expect(sanitizeText("Travel Plan")).toBe("Travel Plan");
  });
});
