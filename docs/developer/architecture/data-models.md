# **Data Models**

This section defines the primary data structures that will be used throughout the application.

## **InstallationManifest**

**Purpose**: To act as the single source of truth for the entire BMad installation on the user's machine. It tracks the core version and all installed modules.

### **JSON Schema**

{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "BMad Installation Manifest",  
  "description": "Defines the structure for tracking the core BMad installation and any installed modules.",  
  "type": "object",  
  "required": \["schemaVersion", "core", "modules"\],  
  "properties": {  
    "schemaVersion": { "type": "string" },  
    "core": {  
      "type": "object",  
      "required": \["version", "installedOn"\],  
      "properties": {  
        "version": { "type": "string" },  
        "installedOn": { "type": "string", "format": "date-time" }  
      }  
    },  
    "modules": {  
      "type": "array",  
      "items": {  
        "type": "object",  
        "required": \["id", "version", "installedOn", "slashPrefix", "assetMap"\],  
        "properties": {  
          "id": { "type": "string" },  
          "version": { "type": "string" },  
          "installedOn": { "type": "string", "format": "date-time" },  
          "slashPrefix": { "type": "string" },  
          "assetMap": { "type": "object" }  
        }  
      }  
    }  
  }  
}
