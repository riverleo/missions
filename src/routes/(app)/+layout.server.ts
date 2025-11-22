export function load({ cookies }) {
	const sidebarCookieState = cookies.get('sidebar:state')?.toLowerCase() === 'true' || false;

	return { sidebarCookieState };
}
