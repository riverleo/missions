<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { toggleMode } from 'mode-watcher';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { House, Settings, Users, FileText } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import Separator from '$lib/components/ui/separator/separator.svelte';
</script>

<Sidebar.Provider open={false}>
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

	<Sidebar.Inset class="z-50">
		<header class="flex h-16 shrink-0 items-center gap-2 border-b p-4">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item class="hidden md:block">
						<Breadcrumb.Link href="##">Home</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator class="hidden md:block" />
					<Breadcrumb.Item>
						<Breadcrumb.Page>Sweet Home</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4">
			<div class="grid auto-rows-min gap-4 md:grid-cols-3">
				<div class="aspect-video rounded-xl bg-muted/50"></div>
				<div class="aspect-video rounded-xl bg-muted/50"></div>
				<div class="aspect-video rounded-xl bg-muted/50"></div>
			</div>
			<div class="min-h-screen flex-1 rounded-xl bg-muted/50"></div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
