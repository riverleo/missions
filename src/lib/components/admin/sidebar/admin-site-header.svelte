<script lang="ts">
	import { useScenario } from '$lib/hooks';
	import { SidebarTrigger } from '$lib/components/ui/sidebar';
	import {
		Breadcrumb,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbList,
		BreadcrumbPage,
		BreadcrumbSeparator,
	} from '$lib/components/ui/breadcrumb';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { page } from '$app/state';
	import TestWorldPopover from '$lib/components/admin/test-world/test-world-popover.svelte';
	import { getBreadcrumbTitleString } from '$lib/utils/label';

	const { fetchAllStatus } = useScenario();

	interface BreadcrumbItemData {
		label: string;
		href: string;
		isLast: boolean;
		loading?: boolean;
	}

	const breadcrumbs = $derived(() => {
		const status = $fetchAllStatus;
		const path = page.url.pathname;
		const segments = path.split('/').filter(Boolean);

		// 항상 Home을 첫 번째로 추가
		const crumbs: BreadcrumbItemData[] = [
			{
				label: '홈',
				href: '/admin',
				isLast: false,
			},
		];

		if (segments.length === 0) return crumbs;

		let currentPath = '/admin';

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			if (!segment) continue;

			// admin은 건너뛰기 (이미 Home으로 처리됨)
			if (segment === 'admin') continue;

			currentPath += `/${segment}`;
			const isLast = i === segments.length - 1;

			let label = segment;
			let loading = false;
			// 라벨 매핑
			if (segment === 'scenarios') label = '시나리오';
			else if (segment === 'chapters') label = '챕터';
			else if (segment === 'quests') label = '퀘스트';
			else if (segment === 'narratives') label = '내러티브';
			else if (segment === 'terrains') label = '지형';
			else if (segment === 'terrains-tiles') label = '지형 타일';
			else if (segment === 'tiles') label = '타일';
			else if (segment === 'characters') label = '캐릭터';
			else if (segment === 'character-bodies') label = '캐릭터 바디';
			else if (segment === 'buildings') label = '건물';
			else if (segment === 'building-interactions') label = '건물 상호작용';
			else if (segment === 'character-interactions') label = '캐릭터 상호작용';
			else if (segment === 'item-interactions') label = '아이템 상호작용';
			else if (segment === 'interactions') label = '상호작용';
			else if (segment === 'conditions') label = '컨디션';
			else if (segment === 'condition-behaviors') label = '컨디션 행동';
			else if (segment === 'items') label = '아이템';
			else if (segment === 'needs') label = '욕구';
			else if (segment === 'need-behaviors') label = '욕구 행동';
			else if (segment === 'behavior-priorities') label = '행동 우선순위';
			// UUID 형태의 ID는 title로 표시
			else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
				const prevSegment = segments[i - 1];
				const title = getBreadcrumbTitleString(segment, prevSegment);
				if (title) {
					label = title;
				} else {
					loading = status === 'loading' || status === 'idle';
					label = loading ? '' : segment.slice(0, 8);
				}
			}

			crumbs.push({
				label,
				href: currentPath,
				isLast,
				loading,
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
	<Breadcrumb class="flex-1">
		<BreadcrumbList>
			{#each breadcrumbs() as crumb, i}
				{#if i > 0}
					<BreadcrumbSeparator />
				{/if}
				<BreadcrumbItem>
					{#if crumb.isLast}
						<BreadcrumbPage>
							{#if crumb.loading}
								<Skeleton class="h-4 w-24" />
							{:else}
								{crumb.label}
							{/if}
						</BreadcrumbPage>
					{:else}
						<BreadcrumbLink href={crumb.href}>
							{#if crumb.loading}
								<Skeleton class="h-4 w-24" />
							{:else}
								{crumb.label}
							{/if}
						</BreadcrumbLink>
					{/if}
				</BreadcrumbItem>
			{/each}
		</BreadcrumbList>
	</Breadcrumb>
	<TestWorldPopover />
</header>
