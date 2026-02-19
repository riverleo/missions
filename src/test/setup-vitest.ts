import { vi } from 'vitest';

vi.mock('$lib/hooks/use-app.svelte', () => ({
	useApp: () => ({
		supabase: {
			auth: {
				getUser: async () => ({ data: { user: null } }),
			},
			from: () => ({
				select: () => ({
					eq: () => ({
						maybeSingle: async () => ({ data: null }),
					}),
				}),
			}),
		},
		user: undefined,
	}),
	setAppContext: vi.fn(),
}));
