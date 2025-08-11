# **Deployment Architecture**

* **Deployment Method**: Publish the TypeScript source code as a versioned package to the **JSR** registry.  
* **User Command**: deno run jsr:@bmad/tui  
* **CI/CD Pipeline**: A GitHub Actions workflow will test the code and publish it to JSR on new version tags.
