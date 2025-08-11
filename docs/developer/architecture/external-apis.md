# **External APIs**

## **BMad Version Check API**

* **Purpose**: To provide the latest version information for the BMad core and all official modules.  
* **Base URL(s)**: https://bmad.dev/versions/ (Example)  
* **Authentication**: None.  
* **Key Endpoints Used**:  
  * GET /versions/manifest.json \- Retrieves a JSON file with the latest versions.  
* **Integration Notes**: The Updater Service will fetch this remote manifest to compare against the local installation-manifest.json. This is crucial for proactively notifying users of available updates, as Deno caches scripts by default and users may not know to run with the \--reload flag.
