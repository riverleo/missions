<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as m from '$lib/paraglide/messages.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { toggleMode } from 'mode-watcher';
	import IconHome2 from '@tabler/icons-svelte/icons/home-2';
	import IconFileText from '@tabler/icons-svelte/icons/file-text';
	import IconUsers from '@tabler/icons-svelte/icons/users';
	import IconSettings from '@tabler/icons-svelte/icons/settings';
	import { wasLoggedIn } from '$lib/stores';

	let { children, open } = $props();
</script>

<Sidebar.Provider {open}>
	<Sidebar.Root collapsible="icon" class="opacity-100">
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
				<Sidebar.GroupLabel>{m['nav.menu']()}</Sidebar.GroupLabel>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<IconHome2 class="h-4 w-4" />
							<span>{m['nav.home']()}</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<IconFileText class="h-4 w-4" />
							<span>{m['nav.documents']()}</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<IconUsers class="h-4 w-4" />
							<span>{m['nav.team']()}</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<IconSettings class="h-4 w-4" />
							<span>{m['nav.settings']()}</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.Group>
		</Sidebar.Content>

		<Sidebar.Footer></Sidebar.Footer>
		<Sidebar.Rail />
	</Sidebar.Root>

	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center gap-2 border-b p-4">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item class="hidden md:block">
						<Breadcrumb.Link onclick={toggleMode}>Home</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator class="hidden md:block" />
					<Breadcrumb.Item>
						<Breadcrumb.Page>Sweet Home</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>
		<div class="flex flex-col gap-4 p-4">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
