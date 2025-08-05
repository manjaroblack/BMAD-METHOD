#!/usr/bin/env -S deno run --allow-read --allow-write

// Simple DI without decorators
class TestService {
  getMessage(): string {
    return "Hello from TestService!";
  }
}

class MainApp {
  private testService: TestService;
  
  constructor() {
    this.testService = new TestService();
  }
  
  run(): void {
    console.log(this.testService.getMessage());
  }
}

const app = new MainApp();
app.run();
