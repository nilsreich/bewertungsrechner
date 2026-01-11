## 2025-05-23 - Debounce SaveState
**Learning:** Writing to localStorage is synchronous and can block the main thread.
**Action:** Always debounce persistence calls that are triggered by high-frequency events like 'input'.
