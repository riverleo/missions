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
	import { useScenario } from '$lib/hooks/use-scenario.svelte';
	import { useScenarioChapter } from '$lib/hooks/use-scenario-chapter.svelte';
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest.svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';

	const admin = useAdmin();
	const { store: scenarioStore } = useScenario();
	const { store: scenarioChapterStore } = useScenarioChapter();
	const { store: scenarioQuestStore } = useScenarioQuest();
	const { store: narrativeStore } = useNarrative();

	function getTitle(id: string, prevSegment: string | undefined): string | undefined {
		// 이전 세그먼트에 따라 어떤 스토어에서 찾을지 결정
		if (prevSegment === 'scenarios') {
			const scenario = $scenarioStore.data?.find((s) => s.id === id);
			return scenario?.title;
		}
		if (prevSegment === 'chapters') {
			const chapter = $scenarioChapterStore.data?.find((c) => c.id === id);
			return chapter?.title;
		}
		if (prevSegment === 'quests') {
			const quest = $scenarioQuestStore.data?.find((q) => q.id === id);
			return quest?.title;
		}
		if (prevSegment === 'narratives') {
			const narrative = $narrativeStore.data?.find((n) => n.id === id);
			return narrative?.title;
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
			// admin은 건너뛰기 (이미 Home으로 처리됨)
			if (segments[i] === 'admin') continue;

			currentPath += `/${segments[i]}`;
			const isLast = i === segments.length - 1;

			let label = segments[i];
			// 라벨 매핑
			if (segments[i] === 'scenarios') label = '시나리오';
			else if (segments[i] === 'chapters') label = '챕터';
			else if (segments[i] === 'quests') label = '퀘스트';
			else if (segments[i] === 'narratives') label = '대화 또는 효과';
			// UUID 형태의 ID는 title로 표시
			else if (
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[i])
			) {
				const id = segments[i];
				const prevSegment = segments[i - 1];
				const title = getTitle(id, prevSegment);
				label = title || id.slice(0, 8);
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
