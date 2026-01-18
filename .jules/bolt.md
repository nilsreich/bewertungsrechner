## 2024-05-22 - Synchronous LocalStorage on Input
**Learning:** Writing to `localStorage` synchronously inside high-frequency `input` event listeners (e.g., typing) blocks the main thread and causes UI jank, especially as the state object grows (e.g., large student lists).
**Action:** Always debounce `saveState` calls attached to `input` events (e.g., 500ms delay), but keep UI updates synchronous for responsiveness. Use `src/utils.ts` for shared utilities like `debounce`.
