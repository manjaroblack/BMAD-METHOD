# **Error Handling Strategy**

* **Error Flow**: Services throw custom, typed BMadError objects. The TUI layer catches these errors, logs the full technical details to a file, and displays a user-friendly message in the UI.  
* **Custom Error Class**: A BMadError class provides a friendlyMessage for the UI, a code for programmatic handling, the original cause for logging, and an isFatal flag.
