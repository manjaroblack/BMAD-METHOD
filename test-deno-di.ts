#!/usr/bin/env -S deno run --allow-read --allow-write

// Test deno-dependency-injector
import { Injectable, Bootstrapped, bootstrap } from "https://deno.land/x/inject@v1.0.0/mod.ts";

@Injectable()
class TestService {
  getMessage(): string {
    return "Hello from TestService!";
  }
}

@Bootstrapped()
class MainApp {
  constructor(private readonly testService: TestService) {}
  
  run(): void {
    console.log(this.testService.getMessage());
  }
}

const app = bootstrap(MainApp);
app.run();
