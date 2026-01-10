## 2024-05-23 - Synchronous LocalStorage Blocking
**Learning:** The application writes to `localStorage` synchronously on every `input` event (keystroke). This blocks the main thread and causes performance degradation, especially with large datasets or lower-end devices.
**Action:** Debounce storage operations to run only after the user stops typing (e.g., 500ms delay).
