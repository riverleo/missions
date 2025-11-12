<script lang="ts">
	import { IconSlash, IconChevronDown } from '@tabler/icons-svelte';
	import {
		Breadcrumb,
		BreadcrumbList,
		BreadcrumbSeparator,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbPage,
	} from '$lib/components/ui/breadcrumb';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem,
	} from '../ui/dropdown-menu';

	const { mission } = $props();
</script>

<Breadcrumb>
	<BreadcrumbList>
		<BreadcrumbItem>
			<BreadcrumbLink href="/" class="whitespace-nowrap">
				{mission}
			</BreadcrumbLink>
		</BreadcrumbItem>
		<BreadcrumbSeparator>
			<IconSlash />
		</BreadcrumbSeparator>
		<BreadcrumbItem>
			<DropdownMenu>
				<DropdownMenuTrigger class="flex items-center gap-1">
					Components
					<IconChevronDown class="size-3.5" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuItem>Documentation</DropdownMenuItem>
					<DropdownMenuItem>Themes</DropdownMenuItem>
					<DropdownMenuItem>GitHub</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</BreadcrumbItem>
		<BreadcrumbSeparator>
			<IconSlash />
		</BreadcrumbSeparator>
		<BreadcrumbItem>
			<BreadcrumbPage>Breadcrumb</BreadcrumbPage>
		</BreadcrumbItem>
	</BreadcrumbList>
</Breadcrumb>
