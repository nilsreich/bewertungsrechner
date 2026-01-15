## 2024-03-24 - [Synchronous LocalStorage on Input]
**Learning:** Writing to localStorage synchronously on every 'input' event (keystroke) causes main thread blocking, especially with `JSON.stringify` on large state objects.
**Action:** Always debounce localStorage writes attached to high-frequency events like 'input'. Keep UI updates synchronous for responsiveness, but delay persistence.
