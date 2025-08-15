# BMAD-METHOD

Documentation scaffolding, doctests, and API docs.

## Doctest

```ts
import { assertEquals } from 'jsr:@std/assert';
import { VERSION } from './mod.ts';

// The public API should expose a VERSION string.
assertEquals(typeof VERSION, 'string');
assertEquals(VERSION.length > 0, true);
```
