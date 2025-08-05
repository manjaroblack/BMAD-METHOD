import { describe, it } from "../../deps.ts";
import { assertEquals } from "jsr:@std/assert@1.0.6";

import { Container } from "../../src/core/container.ts";

describe("Container", () => {
  it("should register and resolve singleton services", () => {
    const container = new Container();
    const testId = "testService";

    let instanceCount = 0;
    container.register(testId, () => {
      instanceCount++;
      return { id: instanceCount };
    }, "singleton");

    const instance1: { id: number } = container.get(testId);
    const instance2: { id: number } = container.get(testId);

    assertEquals(instanceCount, 1);
    assertEquals(instance1, instance2);
  });

  it("should register and resolve transient services", () => {
    const container = new Container();
    const testId = "testTransientService";

    let instanceCount = 0;
    container.register(testId, () => {
      instanceCount++;
      return { id: instanceCount };
    }, "transient");

    const instance1: { id: number } = container.get(testId);
    const instance2: { id: number } = container.get(testId);

    assertEquals(instanceCount, 2);
    assertEquals(instance1.id, 1);
    assertEquals(instance2.id, 2);
  });

  it("should resolve multiple instances with getAll", () => {
    const container = new Container();
    const testId = "testMultiService";

    container.register(testId, () => ({ name: "service1" }), "singleton");
    container.register(testId, () => ({ name: "service2" }), "singleton");

    const instances: Array<{ name: string }> = container.getAll(testId);

    assertEquals(instances.length, 2);
    assertEquals(instances[0]?.name, "service1");
    assertEquals(instances[1]?.name, "service2");
  });
});
