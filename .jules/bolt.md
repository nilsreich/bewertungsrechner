## 2026-01-16 - Synchronous LocalStorage Bottleneck
**Learning:** Writing to localStorage synchronously on every 'input' event blocks the main thread, especially with large state objects (JSON serialization).
**Action:** Always debounce localStorage writes attached to high-frequency input events (typing), while keeping UI updates synchronous for responsiveness.
