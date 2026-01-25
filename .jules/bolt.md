## 2025-05-20 - Synchronous State Persistence on Input
**Learning:** The application was persisting the entire state to `localStorage` (via `JSON.stringify`) on every single `input` event (keystroke). This synchronous operation blocks the main thread, leading to potential input lag, especially as the state size grows or on lower-end devices.
**Action:** When persisting state triggered by high-frequency events like typing, always wrap the storage call in a `debounce` function (e.g., 500ms delay) to batch updates and unblock the UI.
