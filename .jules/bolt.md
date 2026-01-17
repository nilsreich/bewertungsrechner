## 2025-05-24 - [Debounce High Frequency Inputs]
**Learning:** High-frequency input events (like typing) triggering localStorage writes directly cause significant main thread blocking, especially with large datasets (JSON.stringify).
**Action:** Use debounce for all state persistence triggered by 'input' events while keeping UI updates synchronous.
