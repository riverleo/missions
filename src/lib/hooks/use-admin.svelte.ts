import { createContext } from 'svelte';

class AdminContext {
	breadcrumbTitle = $state<string | undefined>(undefined);
}

const [getAdminContext, setAdminContext] = createContext<AdminContext>();

export function createAdminContext() {
	const context = new AdminContext();
	setAdminContext(context);
	return context;
}

export function useAdmin(): AdminContext {
	return getAdminContext();
}
