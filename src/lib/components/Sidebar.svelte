<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as m from '$lib/paraglide/messages.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import IconTarget from '@tabler/icons-svelte/icons/target';
	import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import IconRocket from '@tabler/icons-svelte/icons/rocket';
	import IconDoorExit from '@tabler/icons-svelte/icons/door-exit';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import { wasLoggedIn } from '$lib/stores';
	import PlayerSheet from '$lib/components/player/PlayerSheet.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Kbd from '$lib/components/ui/kbd';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { shortcut, type ShortcutEventDetail } from '@svelte-put/shortcut';

	let { children, open } = $props();

	type Vision = {
		id: string;
		title: string;
		description: string;
		linkedFoundations: string[];
	};

	type Foundation = {
		id: string;
		title: string;
		linkedVisions: string[];
		linkedActions: string[];
	};

	type Action = {
		id: string;
		title: string;
		linkedFoundations: string[];
	};

	let visions = $state<Vision[]>([]);
	let foundations = $state<Foundation[]>([]);
	let actions = $state<Action[]>([]);
	let mission = $state<string>('');

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedVisions = localStorage.getItem('missions-visions');
			const savedFoundations = localStorage.getItem('missions-foundations');
			const savedActions = localStorage.getItem('missions-actions');
			const savedMission = localStorage.getItem('missions-mission');
			if (savedVisions) visions = JSON.parse(savedVisions);
			if (savedFoundations) foundations = JSON.parse(savedFoundations);
			if (savedActions) actions = JSON.parse(savedActions);
			if (savedMission) mission = savedMission;
		}
	});

	function createNewAction() {
		const newAction: Action = {
			id: crypto.randomUUID(),
			title: '',
			linkedFoundations: [],
		};
		actions = [...actions, newAction];
		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-actions', JSON.stringify(actions));
		}
		goto(`/actions/${newAction.id}`);
	}

	function handleShortcut(event: CustomEvent<ShortcutEventDetail>) {
		// Prevent browser default behavior (Ctrl+N / Cmd+N opening new window)
		const keyboardEvent = event.detail.originalEvent;
		keyboardEvent.preventDefault();
		keyboardEvent.stopPropagation();

		createNewAction();
	}

	// Derive breadcrumb data based on current route
	const breadcrumbData = $derived(() => {
		const pathname = $page.url.pathname;
		const segments: Array<{
			label: string;
			href?: string;
			items?: Array<{ id: string; title: string }>;
		}> = [];

		// Mission is always first
		segments.push({ label: mission || 'Mission', href: '/' });

		// Check if we're on a vision detail page
		if (pathname.startsWith('/visions/')) {
			const visionId = pathname.split('/')[2];
			const vision = visions.find((v) => v.id === visionId);
			if (vision) {
				segments.push({ label: vision.title || 'Untitled Vision' });
			}
		}
		// Check if we're on a foundation detail page
		else if (pathname.startsWith('/foundations/')) {
			const foundationId = pathname.split('/')[2];
			const foundation = foundations.find((f) => f.id === foundationId);
			if (foundation) {
				// Add linked visions
				const linkedVisions = foundation.linkedVisions
					.map((vId) => visions.find((v) => v.id === vId))
					.filter(Boolean) as Vision[];
				if (linkedVisions.length === 1) {
					segments.push({
						label: linkedVisions[0].title || 'Untitled Vision',
						href: `/visions/${linkedVisions[0].id}`,
					});
				} else if (linkedVisions.length > 1) {
					segments.push({
						label: `${linkedVisions.length} Visions`,
						items: linkedVisions.map((v) => ({ id: v.id, title: v.title || 'Untitled Vision' })),
					});
				}
				segments.push({ label: foundation.title || 'Untitled Foundation' });
			}
		}
		// Check if we're on an action detail page
		else if (pathname.startsWith('/actions/')) {
			const actionId = pathname.split('/')[2];
			const action = actions.find((a) => a.id === actionId);
			if (action) {
				// Add linked foundations
				const linkedFoundations = action.linkedFoundations
					.map((fId) => foundations.find((f) => f.id === fId))
					.filter(Boolean) as Foundation[];

				// Get unique visions from linked foundations
				const visionIds = new Set<string>();
				linkedFoundations.forEach((foundation) => {
					foundation.linkedVisions.forEach((vId) => visionIds.add(vId));
				});
				const linkedVisions = Array.from(visionIds)
					.map((vId) => visions.find((v) => v.id === vId))
					.filter(Boolean) as Vision[];

				// Add vision breadcrumb
				if (linkedVisions.length === 1) {
					segments.push({
						label: linkedVisions[0].title || 'Untitled Vision',
						href: `/visions/${linkedVisions[0].id}`,
					});
				} else if (linkedVisions.length > 1) {
					segments.push({
						label: `${linkedVisions.length} Visions`,
						items: linkedVisions.map((v) => ({ id: v.id, title: v.title || 'Untitled Vision' })),
					});
				}

				// Add foundation breadcrumb
				if (linkedFoundations.length === 1) {
					segments.push({
						label: linkedFoundations[0].title || 'Untitled Foundation',
						href: `/foundations/${linkedFoundations[0].id}`,
					});
				} else if (linkedFoundations.length > 1) {
					segments.push({
						label: `${linkedFoundations.length} Foundations`,
						items: linkedFoundations.map((f) => ({ id: f.id, title: f.title || 'Untitled Foundation' })),
					});
				}

				segments.push({ label: action.title || 'Untitled Action' });
			}
		}

		return segments;
	});
</script>

<svelte:window
	use:shortcut={{
		trigger: {
			key: 'a',
			modifier: ['ctrl', 'meta'],
		},
	}}
	onshortcut={handleShortcut}
/>

<Sidebar.Provider {open}>
	<Sidebar.Root>
		<Sidebar.Header>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="lg">
						<Avatar>
							<AvatarFallback>M</AvatarFallback>
						</Avatar>
						<div class="flex flex-col">
							<span class="text-sm font-semibold">{m['app.title']()}</span>
							<span class="text-xs text-muted-foreground">{m['app.subtitle']()}</span>
						</div>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>

		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<IconTarget class="h-4 w-4" />
							<a href="/">
								<span>Home</span>
							</a>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<IconTarget class="h-4 w-4" />
							<a href="/visions">
								<span>Visions</span>
							</a>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<IconCircleCheck class="h-4 w-4" />
							<a href="/foundations">
								<span>Foundations</span>
							</a>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<IconRocket class="h-4 w-4" />
							<a href="/actions">
								<span>Actions</span>
							</a>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.Group>
		</Sidebar.Content>

		<Sidebar.Footer></Sidebar.Footer>
		<Sidebar.Rail />
	</Sidebar.Root>

	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center justify-between gap-2 border-b p-4">
			<div class="flex h-6 items-center">
				<div class="-ml-1">
					<Sidebar.Trigger />

					<Tooltip.Provider delayDuration={0}>
						<Tooltip.Root open={true}>
							<Tooltip.Trigger>
								<Button size="icon" variant="ghost" onclick={createNewAction}>
									<IconPlus />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content class="flex items-center gap-2">
								새로운 액션
								<Kbd.Group>
									<Kbd.Root>⌘</Kbd.Root>
									<Kbd.Root>A</Kbd.Root>
								</Kbd.Group>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
				<Separator orientation="vertical" class="mr-4 ml-3" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						{#each breadcrumbData() as segment, i}
							{#if i > 0}
								<Breadcrumb.Separator class="hidden md:block" />
							{/if}
							<Breadcrumb.Item class="hidden md:block">
								{#if segment.items && segment.items.length > 0}
									<!-- Dropdown for multiple items -->
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class="flex items-center gap-1">
											<Breadcrumb.Link class="flex items-center gap-1">
												{segment.label}
												<Badge
													variant="secondary"
													class="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
												>
													{segment.items.length}
												</Badge>
												<IconChevronDown class="h-3 w-3" />
											</Breadcrumb.Link>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content>
											{#each segment.items as item}
												<DropdownMenu.Item
													onclick={() => {
														const type = segment.label.includes('Vision') ? 'visions' : 'foundations';
														goto(`/${type}/${item.id}`);
													}}
												>
													{item.title}
												</DropdownMenu.Item>
											{/each}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{:else if segment.href}
									<!-- Link to page -->
									<Breadcrumb.Link href={segment.href}>{segment.label}</Breadcrumb.Link>
								{:else}
									<!-- Current page -->
									<Breadcrumb.Page>{segment.label}</Breadcrumb.Page>
								{/if}
							</Breadcrumb.Item>
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
			<div class="flex items-center gap-2">
				<PlayerSheet />
				<Button size="icon" variant="ghost" onclick={() => ($wasLoggedIn = false)}>
					<IconDoorExit />
				</Button>
			</div>
		</header>
		<div class="flex flex-col gap-4 p-4">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
