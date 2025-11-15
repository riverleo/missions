<script lang="ts">
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import {
		Tooltip,
		TooltipProvider,
		TooltipTrigger,
		TooltipContent,
	} from '$lib/components/ui/tooltip';
	import AppSidebarBreadcrumb from './app-sidebar-breadcrumb.svelte';
	import { NewQuestTrigger } from '$lib/components/quest';

	const { mission }: { mission: string } = $props();
	const sidebar = useSidebar();
</script>

<header class="sticky top-0 left-0 flex h-16 items-center gap-3 border-b bg-background px-3">
	<div class="flex items-center gap-1">
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<SidebarTrigger {...props} />
					{/snippet}
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

		<NewQuestTrigger />
	</div>
	<div class="h-6">
		<Separator orientation="vertical" />
	</div>
	<AppSidebarBreadcrumb {mission} />
</header>
