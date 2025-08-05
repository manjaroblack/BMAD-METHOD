#!/usr/bin/env -S deno run --allow-read --allow-write

// Import reflect-metadata first for InversifyJS decorators
import "./deps.ts";

import { injectable, inject } from "./deps.ts";
import { TYPES } from "./src/core/types.ts";

@injectable()
class TestClass {
  constructor(
    @inject(TYPES.IConfigService) private readonly configService: any,
  ) {}
}

console.log("Decorator test passed");
