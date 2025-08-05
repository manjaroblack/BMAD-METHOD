import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { ConfigService } from "./ConfigService.ts";

Deno.test("ConfigService - get and set values", () => {
  const config = new ConfigService();

  // Test setting and getting a value
  config.set("testKey", "testValue");
  assertEquals(config.get("testKey"), "testValue");

  // Test default value
  assertEquals(config.get("nonExistentKey", "defaultValue"), "defaultValue");
});
