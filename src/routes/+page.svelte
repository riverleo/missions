<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { toggleMode } from 'mode-watcher';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { House, Settings, Users, FileText } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
</script>

<Sidebar.Provider open={false}>
	<div class="flex min-h-screen w-full">
		<Sidebar.Root collapsible="icon">
			<Sidebar.Header>
				<div class="flex items-center gap-2 px-4 py-2">
					<Avatar>
						<AvatarFallback>M</AvatarFallback>
					</Avatar>
					<div class="flex flex-col">
						<span class="text-sm font-semibold">{m['app.title']()}</span>
						<span class="text-xs text-muted-foreground">{m['app.subtitle']()}</span>
					</div>
				</div>
			</Sidebar.Header>

			<Sidebar.Content>
				<Sidebar.Group>
					<Sidebar.GroupLabel>{m['nav.menu']()}</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									<House class="h-4 w-4" />
									<span>{m['nav.home']()}</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									<FileText class="h-4 w-4" />
									<span>{m['nav.documents']()}</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									<Users class="h-4 w-4" />
									<span>{m['nav.team']()}</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									<Settings class="h-4 w-4" />
									<span>{m['nav.settings']()}</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</Sidebar.Content>

			<Sidebar.Footer>
				<div class="p-4">
					<Button class="w-full" variant="outline" onclick={toggleMode}>
						{m['ui.darkModeToggle']()}
					</Button>
				</div>
			</Sidebar.Footer>
		</Sidebar.Root>

		<main class="flex-1">
			<header class="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
				<Sidebar.Trigger />
				<h1 class="text-lg font-semibold">{m['page.dashboard']()}</h1>
				<div class="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
					<span>{getLocale()}</span>
				</div>
			</header>

			<div class="flex flex-col gap-4 p-8">hello world</div>
		</main>
	</div>
</Sidebar.Provider>
