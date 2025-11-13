<script lang="ts">
	import type { DOMAttributes } from 'svelte/elements';
	import {
		Sidebar,
		SidebarProvider,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuItem,
		SidebarMenuButton,
		SidebarInset,
		SidebarContent,
		SidebarGroup,
	} from '$lib/components/ui/sidebar';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { m } from '$lib/paraglide/messages';
	import AppSidebarHeader from './app-sidebar-header.svelte';

	let {
		children,
		open,
		mission = 'OOAAH',
	}: Pick<DOMAttributes<EventTarget>, 'children'> & {
		open?: boolean;
		mission?: string;
	} = $props();
</script>

<SidebarProvider {open}>
	<Sidebar>
		<SidebarHeader>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg">
						<Avatar>
							<AvatarFallback>M</AvatarFallback>
						</Avatar>
						<div class="flex flex-col">
							<span class="text-sm font-semibold">{m['app.title']()}</span>
							<span class="text-xs text-muted-foreground">{m['app.subtitle']()}</span>
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>

		<SidebarContent>
			<SidebarGroup>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton>작업중</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		</SidebarContent>
	</Sidebar>

	<SidebarInset>
		<AppSidebarHeader {mission} />
		<div class="flex flex-col gap-4 p-4">
			{@render children?.()}
		</div>
	</SidebarInset>
</SidebarProvider>
