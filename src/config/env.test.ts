import { describe, expect, it } from "vite-plus/test";
import { parseEnv } from "./env";

describe("environment configuration", () => {
  it("defaults to portable same-origin API and cookie auth", () => {
    expect(parseEnv({})).toEqual({
      apiUrl: "/api",
      authStrategy: "cookie",
      requestTimeoutMs: 15000,
    });
    expect(parseEnv({ PROD: true }).apiUrl).toBe("/api");
  });
  it("normalizes a configured HTTPS API and bearer auth", () => {
    expect(
      parseEnv({
        VITE_API_URL: " https://api.example.com/v1/ ",
        VITE_AUTH_STRATEGY: "bearer",
        VITE_REQUEST_TIMEOUT_MS: "5000",
        PROD: true,
      }),
    ).toEqual({
      apiUrl: "https://api.example.com/v1",
      authStrategy: "bearer",
      requestTimeoutMs: 5000,
    });
  });
  it.each([
    "ftp://example.com",
    "//example.com/api",
    "https://u:p@example.com",
    "https://example.com?key=secret",
    "https://example.com/#fragment",
    "not a URL",
  ])("rejects unsafe API URL %s", (apiUrl) => {
    expect(() => parseEnv({ VITE_API_URL: apiUrl })).toThrow();
  });
  it("rejects plaintext production API URLs but allows local development", () => {
    expect(() => parseEnv({ VITE_API_URL: "http://localhost:8080/api", PROD: true })).toThrow(
      "HTTPS",
    );
    expect(parseEnv({ VITE_API_URL: "http://localhost:8080/api" }).apiUrl).toBe(
      "http://localhost:8080/api",
    );
  });
  it("rejects unknown auth strategies", () => {
    expect(() => parseEnv({ VITE_AUTH_STRATEGY: "invalid" })).toThrow("cookie or bearer");
  });
  it.each(["", "0", "-1", "NaN", "Infinity", "1.5", "2147483648"])(
    "rejects invalid timeout %s",
    (timeout) => {
      expect(() => parseEnv({ VITE_REQUEST_TIMEOUT_MS: timeout })).toThrow(
        "positive timer-safe integer",
      );
    },
  );
});
