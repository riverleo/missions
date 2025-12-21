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
	import { useScenario } from '$lib/hooks/use-scenario';
	import { useChapter } from '$lib/hooks/use-chapter';
	import { useQuest } from '$lib/hooks/use-quest';
	import { useNarrative } from '$lib/hooks/use-narrative';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useNeed } from '$lib/hooks/use-need';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import TestWorldPopover from '$lib/components/admin/test-world/test-world-popover.svelte';

	const { store: scenarioStore } = useScenario();
	const { store: chapterStore } = useChapter();
	const { questStore } = useQuest();
	const { narrativeStore } = useNarrative();
	const { store: terrainStore } = useTerrain();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();
	const { needStore } = useNeed();
	const { needBehaviorStore } = useNeedBehavior();

	function getTitle(id: string, prevSegment: string | undefined): string | undefined {
		// 이전 세그먼트에 따라 어떤 스토어에서 찾을지 결정
		if (prevSegment === 'scenarios') {
			return $scenarioStore.data?.[id]?.title;
		}
		if (prevSegment === 'chapters') {
			return $chapterStore.data?.[id]?.title;
		}
		if (prevSegment === 'quests') {
			return $questStore.data?.[id]?.title;
		}
		if (prevSegment === 'narratives') {
			return $narrativeStore.data?.[id]?.title;
		}
		if (prevSegment === 'terrains') {
			return $terrainStore.data?.[id]?.title;
		}
		if (prevSegment === 'characters') {
			return $characterStore.data?.[id]?.name;
		}
		if (prevSegment === 'buildings') {
			return $buildingStore.data?.[id]?.name;
		}
		if (prevSegment === 'needs') {
			return $needStore.data?.[id]?.name;
		}
		if (prevSegment === 'behaviors') {
			return $needBehaviorStore.data?.[id]?.name;
		}
		return undefined;
	}

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

		let currentPath = '/admin';

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			if (!segment) continue;

			// admin은 건너뛰기 (이미 Home으로 처리됨)
			if (segment === 'admin') continue;

			currentPath += `/${segment}`;
			const isLast = i === segments.length - 1;

			let label = segment;
			// 라벨 매핑
			if (segment === 'scenarios') label = '시나리오';
			else if (segment === 'chapters') label = '챕터';
			else if (segment === 'quests') label = '퀘스트';
			else if (segment === 'narratives') label = '내러티브';
			else if (segment === 'terrains') label = '지형';
			else if (segment === 'characters') label = '캐릭터';
			else if (segment === 'buildings') label = '건물';
			else if (segment === 'needs') label = '욕구';
			else if (segment === 'behaviors') label = '행동';
			else if (segment === 'world-test') label = '월드 테스트';
			// UUID 형태의 ID는 title로 표시
			else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
				const prevSegment = segments[i - 1];
				const title = getTitle(segment, prevSegment);
				label = title || segment.slice(0, 8);
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
	<Breadcrumb class="flex-1">
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
	<TestWorldPopover />
</header>
