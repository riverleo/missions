<script lang="ts">
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import {
		Tooltip,
		TooltipProvider,
		TooltipTrigger,
		TooltipContent,
	} from '$lib/components/ui/tooltip';
	import AppSidebarBreadcrumb from './app-sidebar-breadcrumb.svelte';

	const { mission } = $props();
	const sidebar = useSidebar();
</script>

<header class="sticky top-0 left-0 flex h-16 items-center gap-3 border-b bg-background px-3">
	<div class="flex items-center gap-1">
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger>
					<SidebarTrigger />
				</TooltipTrigger>
				<TooltipContent class="flex items-center gap-1.5">
					사이드 메뉴 {sidebar.open ? '닫기' : '열기'}
					<KbdGroup>
						<Kbd>⌘</Kbd>
						<Kbd>B</Kbd>
					</KbdGroup>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>

		<Button size="sm" variant="outline" class="px-2 text-xs">
			새로운 퀘스트
			<Kbd>Q</Kbd>
		</Button>
	</div>
	<div class="h-6">
		<Separator orientation="vertical" />
	</div>
	<AppSidebarBreadcrumb {mission} />
</header>
