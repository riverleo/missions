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
	import { useScenario } from '$lib/hooks/use-scenario';
	import { useScenarioChapter } from '$lib/hooks/use-scenario-chapter';
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest';
	import { useNarrative } from '$lib/hooks/use-narrative';

	const admin = useAdmin();
	const { store: scenarioStore } = useScenario();
	const { store: scenarioChapterStore } = useScenarioChapter();
	const { scenarioQuestStore } = useScenarioQuest();
	const { narrativeStore } = useNarrative();

	function getTitle(id: string, prevSegment: string | undefined): string | undefined {
		// 이전 세그먼트에 따라 어떤 스토어에서 찾을지 결정
		if (prevSegment === 'scenarios') {
			return $scenarioStore.data?.[id]?.title;
		}
		if (prevSegment === 'chapters') {
			return $scenarioChapterStore.data?.[id]?.title;
		}
		if (prevSegment === 'quests') {
			return $scenarioQuestStore.data?.[id]?.title;
		}
		if (prevSegment === 'narratives') {
			return $narrativeStore.data?.[id]?.title;
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
			else if (segment === 'narratives') label = '대화 또는 효과';
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
</header>
