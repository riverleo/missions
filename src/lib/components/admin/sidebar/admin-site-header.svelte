<script lang="ts">
	import { SidebarTrigger } from '$lib/components/ui/sidebar';
	import {
		Breadcrumb,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbList,
		BreadcrumbPage,
		BreadcrumbSeparator,
	} from '$lib/components/ui/breadcrumb';
	import { page } from '$app/state';
	import { useAdmin } from '$lib/hooks/use-admin.svelte';

	const admin = useAdmin();

	const breadcrumbs = $derived(() => {
		const path = page.url.pathname;
		const segments = path.split('/').filter(Boolean);

		// 항상 Home을 첫 번째로 추가
		const crumbs = [
			{
				label: '홈',
				href: '/admin',
				isLast: false,
			},
		];

		if (segments.length === 0) return crumbs;

		let currentPath = '';

		for (let i = 0; i < segments.length; i++) {
			// admin은 건너뛰기 (이미 Home으로 처리됨)
			if (segments[i] === 'admin') continue;

			currentPath += `/${segments[i]}`;
			const isLast = i === segments.length - 1;

			let label = segments[i];
			// 라벨 매핑
			if (segments[i] === 'quests') label = '퀘스트';
			else if (segments[i] === 'narratives') label = '대화 또는 효과';
			// UUID 형태의 ID는 title (id) 형식으로 표시
			else if (
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[i])
			) {
				const id = segments[i];
				const title = admin.breadcrumbTitle || id;
				label = title !== id ? `${title} (${id.slice(0, 8)})` : id.slice(0, 8);
			}

			crumbs.push({
				label,
				href: currentPath,
				isLast,
			});
		}

		// 마지막 항목만 isLast = true로 설정
		crumbs.forEach((c, i) => {
			c.isLast = i === crumbs.length - 1;
		});

		return crumbs;
	});
</script>

<header class="flex h-16 shrink-0 items-center gap-5 border-b px-4">
	<SidebarTrigger />
	<Breadcrumb>
		<BreadcrumbList>
			{#each breadcrumbs() as crumb, i}
				{#if i > 0}
					<BreadcrumbSeparator />
				{/if}
				<BreadcrumbItem>
					{#if crumb.isLast}
						<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
					{:else}
						<BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
					{/if}
				</BreadcrumbItem>
			{/each}
		</BreadcrumbList>
	</Breadcrumb>
	<div class="ml-auto">
		{#if admin.siteHeaderActions}
			{@render admin.siteHeaderActions()}
		{/if}
	</div>
</header>
