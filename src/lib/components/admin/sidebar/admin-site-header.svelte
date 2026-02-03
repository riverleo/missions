<script lang="ts">
	import { useBehavior, useBuilding, useChapter, useCharacter, useItem, useNarrative, useQuest, useScenario, useTerrain } from '$lib/hooks';
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
	import type {
		ScenarioId,
		ChapterId,
		QuestId,
		NarrativeId,
		TerrainId,
		CharacterId,
		CharacterBodyId,
		BuildingId,
		BuildingInteractionId,
		CharacterInteractionId,
		ItemInteractionId,
		ConditionId,
		ConditionBehaviorId,
		ItemId,
		NeedId,
		NeedBehaviorId,
	} from '$lib/types';
	import TestWorldPopover from '$lib/components/admin/test-world/test-world-popover.svelte';
	import { getBehaviorInteractTypeLabel } from '$lib/utils/state-label';

	const { scenarioStore } = useScenario();
	const { chapterStore } = useChapter();
	const { questStore } = useQuest();
	const { narrativeStore } = useNarrative();
	const { terrainStore } = useTerrain();
	const { characterStore, characterBodyStore, needStore, characterInteractionStore } =
		useCharacter();
	const { buildingStore, conditionStore, buildingInteractionStore } = useBuilding();
	const { conditionBehaviorStore, needBehaviorStore } = useBehavior();
	const { itemStore, itemInteractionStore } = useItem();

	function getTitle(id: string, prevSegment: string | undefined): string | undefined {
		// 이전 세그먼트에 따라 어떤 스토어에서 찾을지 결정
		if (prevSegment === 'scenarios') {
			return $scenarioStore.data?.[id as ScenarioId]?.title;
		}
		if (prevSegment === 'chapters') {
			return $chapterStore.data?.[id as ChapterId]?.title;
		}
		if (prevSegment === 'quests') {
			return $questStore.data?.[id as QuestId]?.title;
		}
		if (prevSegment === 'narratives') {
			return $narrativeStore.data?.[id as NarrativeId]?.title;
		}
		if (prevSegment === 'terrains') {
			return $terrainStore.data?.[id as TerrainId]?.title;
		}
		if (prevSegment === 'characters') {
			return $characterStore.data?.[id as CharacterId]?.name;
		}
		if (prevSegment === 'character-bodies') {
			return $characterBodyStore.data?.[id as CharacterBodyId]?.name;
		}
		if (prevSegment === 'buildings') {
			return $buildingStore.data?.[id as BuildingId]?.name;
		}
		if (prevSegment === 'building-interactions') {
			const interaction = $buildingInteractionStore.data?.[id as BuildingInteractionId];
			if (!interaction) return undefined;
			const building = $buildingStore.data?.[interaction.building_id];
			const character = interaction.character_id
				? $characterStore.data?.[interaction.character_id]
				: undefined;
			const interactionType = (interaction.once_interaction_type ||
				interaction.repeat_interaction_type)!;
			const behaviorLabel = getBehaviorInteractTypeLabel(interactionType);
			const characterName = character ? character.name : '모든 캐릭터';
			return `${building?.name ?? '건물'} - ${characterName} ${behaviorLabel}`;
		}
		if (prevSegment === 'character-interactions') {
			const interaction = $characterInteractionStore.data?.[id as CharacterInteractionId];
			if (!interaction) return undefined;
			const targetCharacter = $characterStore.data?.[interaction.target_character_id];
			const character = interaction.character_id
				? $characterStore.data?.[interaction.character_id]
				: undefined;
			const interactionType = (interaction.once_interaction_type ||
				interaction.repeat_interaction_type)!;
			const behaviorLabel = getBehaviorInteractTypeLabel(interactionType);
			const characterName = character ? character.name : '모든 캐릭터';
			return `${targetCharacter?.name ?? '캐릭터'} - ${characterName} ${behaviorLabel}`;
		}
		if (prevSegment === 'item-interactions') {
			const interaction = $itemInteractionStore.data?.[id as ItemInteractionId];
			if (!interaction) return undefined;
			const item = $itemStore.data?.[interaction.item_id];
			const character = interaction.character_id
				? $characterStore.data?.[interaction.character_id]
				: undefined;
			const interactionType = (interaction.once_interaction_type ||
				interaction.repeat_interaction_type)!;
			const behaviorLabel = getBehaviorInteractTypeLabel(interactionType);
			const characterName = character ? character.name : '모든 캐릭터';
			return `${item?.name ?? '아이템'} - ${characterName} ${behaviorLabel}`;
		}
		if (prevSegment === 'conditions') {
			return $conditionStore.data?.[id as ConditionId]?.name;
		}
		if (prevSegment === 'condition-behaviors') {
			return $conditionBehaviorStore.data?.[id as ConditionBehaviorId]?.name;
		}
		if (prevSegment === 'items') {
			return $itemStore.data?.[id as ItemId]?.name;
		}
		if (prevSegment === 'needs') {
			return $needStore.data?.[id as NeedId]?.name;
		}
		if (prevSegment === 'need-behaviors') {
			return $needBehaviorStore.data?.[id as NeedBehaviorId]?.name;
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
