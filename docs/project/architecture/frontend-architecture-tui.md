# **Frontend Architecture (TUI)**

* **Component Architecture**: The TUI is a tree of components. "Views" are top-level components representing a screen, and they are composed of smaller, reusable "Components."  
* **State Management**: A **Signal-based architecture** using **Preact Signals** for hyper-efficient, fine-grained reactivity. Signals manage state, while Components and Views structure the UI.  
* **Routing**: A simple currentView property on the global state object, managed by the main TuiApplication.ts component.  
* **Services Layer**: UI views communicate with Core Services via **Dependency Injection**.
