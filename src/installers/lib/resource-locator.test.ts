import {
  beforeEach,
  describe,
  it,
  assertEquals,
  ResourceLocator,
} from "deps";

describe("ResourceLocator", () => {
  let resourceLocator: ResourceLocator;

  beforeEach(() => {
    resourceLocator = new ResourceLocator();
  });

  it("should get BMad core path", () => {
    const result = resourceLocator.getBmadCorePath();
    assertEquals(typeof result, "string");
  });

  it("should get expansion packs path", () => {
    const result = resourceLocator.getExpansionPacksPath();
    assertEquals(typeof result, "string");
  });

  it("should get expansion pack path by ID", () => {
    const result = resourceLocator.getExpansionPackPath("test-pack");
    assertEquals(typeof result, "string");
  });
});
