# Coding Agent Guidelines

This document provides essential guidelines for AI coding agents working in this repository. A SvelteKit 5 + TypeScript gamified task management application with Matter.js physics engine.

---

## Quick Reference

### Commands

**Development:**

- `pnpm dev` - Start development server (http://localhost:5173)
- `pnpm build` - Production build
- `pnpm preview` - Preview production build

**Code Quality:**

- `pnpm check` - Run svelte-check (type checking)
- `pnpm check:watch` - Watch mode for type checking
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Check code formatting (Prettier)

**Testing:**

- `pnpm test` - Run all E2E tests
- `pnpm test:e2e` - Run E2E tests explicitly
- `npx playwright test e2e/demo.test.ts` - Run single test file
- `npx playwright test --grep "test name"` - Run tests matching pattern

**Storybook:**

- `pnpm storybook` - Start Storybook dev server (port 6006)
- `pnpm build-storybook` - Build static Storybook

### Package Manager

**CRITICAL: Use `pnpm` ONLY. Never use `npm` or `yarn`.**

---

## Code Style

### Imports

- ❌ **FORBIDDEN**: `import * as X from 'module'`
- ✅ **Required**: Explicit named imports
- ✅ shadcn-svelte: `import { Button } from '$lib/components/ui/button'`
- ✅ Icons: `@tabler/icons-svelte` with `Icon` prefix (e.g., `IconCheck`, `IconDotsVertical`)

### Formatting (Prettier)

- **Indentation**: Tabs (not spaces)
- **Quotes**: Single quotes
- **Line width**: 100 characters
- **Trailing commas**: ES5
- **Svelte**: Shorthand enabled, HTML whitespace ignored

### TypeScript Types

**Branded ID Types:**

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };
export type BuildingId = Brand<string, 'BuildingId'>;
export type WorldBuildingId = Brand<string, 'WorldBuildingId'>;
```

**Type Rules:**

- ✅ Use `undefined` (NOT `null` except in database)
- ✅ `noUncheckedIndexedAccess` is enabled - handle optional array access
- ❌ **ABSOLUTELY FORBIDDEN**: `as any`
- ✅ Supabase queries: `.single<Type>()` (NOT `as Type` casting)

**Type Casting Patterns (for branded types):**

```typescript
// Record indexing
const building = $store.data[id as BuildingId];

// Route params
const scenarioId = page.params.scenarioId as ScenarioId;

// UUID generation
const worldId = crypto.randomUUID() as WorldId;
```

### Naming Conventions

- **Functions**: Match prop/event names (NOT `handleSubmit` → ✅ `onsubmit`)
- **Domain names**: Be explicit (`branch` → ✅ `questBranch`)
- **Hooks**: Short for own domain (`fetch`, `create`), prefixed for sub-domains (`createScenarioQuestBranch`)

### Component Patterns

- **Hooks**: Use directly in components (NO prop drilling)
- **Utilities**: Prefer **Radash** over lodash
- **Event handlers**: Avoid literal functions in JSX/templates
- **Logic**: Keep in components, callbacks only pass results
- **Shared logic**: Extract to separate files when used across multiple components

---

## Svelte 5 Specifics

### Runes (Modern API)

✅ **Use these:**

- `$state` - Reactive state
- `$derived` - Computed values
- `$effect` - Side effects

❌ **DEPRECATED - Do NOT use:**

- `$app/stores` → ✅ Use `$app/state` instead

### State Management

**External Objects:**

```typescript
// Use $state.raw() for non-Svelte objects
const engine = $state.raw(Matter.Engine.create());
const domElement = $state.raw(document.querySelector('.canvas'));
```

**Store Updates:**

```typescript
// Use Immer's produce() for immutable updates
import { produce } from 'immer';

produce(store, (draft) => {
	draft.data[id] = newValue;
});
```

**Context:**

- Only accessible during component initialization
- Pass to classes via constructor parameters

**Component Independence:**

- Share state via stores (NOT props)
- Each component is independent

### Effect Pattern

**Prop Change Detection:**

```typescript
let prevValue = prop?.value;
$effect(() => {
	const current = prop?.value;
	if (current !== prevValue) {
		prevValue = current;
		// Handle change logic here
	}
});
```

**Important**: All reactive values in `$effect` are auto-tracked. For frequently changing values (e.g., mouse coordinates), separate with `$derived` and throttle.

---

## Patterns & Best Practices

### Bug Resolution Process

**CRITICAL - Follow this order:**

1. **Root cause analysis** - Understand why the bug exists
2. **Small test** - Test fix in isolation
3. **Verify** - Confirm it works
4. **Full deployment** - Apply to entire codebase

### EntityIdUtils

Utility for working with entity IDs (`$lib/utils/entity-id.ts`):

```typescript
// Create EntityId
EntityIdUtils.create(type, worldId, id);
EntityIdUtils.create(entityInstance); // From object

// Parse EntityId
const { type, worldId, instanceId } = EntityIdUtils.parse(entityId);

// Type checking
EntityIdUtils.is('building', entityId); // Single type
EntityIdUtils.or(['building', 'character'], entityId); // Multiple types
```

**Pattern**: Cache parsed results with `$derived` for reuse:

```typescript
const parsed = $derived(EntityIdUtils.parse(entityId));
```

### RecordFetchState

```typescript
interface RecordFetchState<K extends string, T> {
	status: FetchStatus;
	data: Record<K, T>; // ✅ ALWAYS defined (non-optional)
	error?: Error;
}
```

**Usage**: Access `data` directly (no `?? {}`):

```typescript
const items = Object.values($store.data); // ✅ Safe
```

### Utilities

- Prefer **Radash** utilities first
- Cache computations with `$derived`
- Centralize constants in `constants.ts`

---

## Database

### RLS Policy Naming

- **Format**: Lowercase, plural subjects
- **Example**: `"anyone can view tiles"`, `"admins can update buildings"`

### Constraints & Indexes

**Naming Prefixes:**

- `uq_` - Unique constraints
- `fk_` - Foreign keys
- `idx_` - Indexes
- `chk_` - Check constraints

**Rules:**

- Enforce data integrity at **DB level** (never bypass in application)
- Prefer **inline constraints** when creating tables
- Prefer **DB default values** over explicit application values

### Supabase Queries

```typescript
// ✅ Type-safe single result
const { data, error } = await supabase
	.from('buildings')
	.select('*')
	.eq('id', buildingId)
	.single<Building>();

// ✅ 0 or 1 result
const { data, error } = await supabase
	.from('user_roles')
	.select('*')
	.eq('user_id', userId)
	.maybeSingle<UserRole>();

// ❌ FORBIDDEN - No type casting
const data = result.data as Building;
```

### Helper Functions

**RLS Checks:**

- `is_admin()` - Check if current user is admin
- `is_me(user_id)` - Check if user_id matches current user
- `is_own_player(player_id)` - Check if player belongs to current user
- `is_world_owner(world_id)` - Check if current user owns world

**Audit:**

- `current_user_role_id()` - Get current user role ID for audit columns

**Triggers:**

- `update_updated_at()` - Auto-update `updated_at` on UPDATE

---

## UI Components

### Component Library

**shadcn-svelte (Primary):**

- ✅ Use explicit imports (NO `import * as`)
- Example: `import { Button } from '$lib/components/ui/button'`

**Labels:**

- ❌ **FORBIDDEN**: `<Label>` component
- ✅ **Use instead**: `<InputGroupText>` or `<ButtonGroupText>`

**Icons:**

- ✅ From `@tabler/icons-svelte`
- ✅ Use `Icon` prefix naming
- ❌ **NO** `class` attribute on icons

**Button/Input Groups:**

- ❌ No styles on internal ButtonGroup/InputGroup elements
- ❌ No `InputGroup + Select` combo
- ✅ Use `ButtonGroup + Select` instead

### Admin Page Structure

**Route Pattern:**

```
/admin/scenarios/[scenarioId]/{domain}/[{domain}Id]/
```

**Component Types:**

- `aside` - Sidebar navigation
- `command` - Command palette for entity selection
- `create-dialog` - Entity creation modal
- `delete-dialog` - Entity deletion modal
- `panel` - Main content/action panel

**Hook Pattern:**

- `store` - Domain data store
- `dialogStore` - Dialog state management
- `fetch` - Data fetching logic
- `openDialog/closeDialog` - Dialog control functions
- `admin.create/update/remove` - CRUD operations

---

## Project Context

### Tech Stack

- **Framework**: SvelteKit 2.48+ with Svelte 5 (runes API)
- **Language**: TypeScript 5.9+ (strict mode)
- **Styling**: Tailwind CSS 4.1+
- **UI**: shadcn-svelte components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Physics**: Matter.js 0.20
- **State**: Immer for immutable updates
- **Utils**: Radash 12.1+

### Key Concepts

This is a **gamified task management app** where:

- Users complete missions/tasks to earn coins
- Coins build structures in a 2D physics world
- Characters have needs (hunger, fatigue, faith, happiness)
- Faith increases only through task completion
- Utility AI system drives character behavior

---

**Last Updated**: 2025-01-14
