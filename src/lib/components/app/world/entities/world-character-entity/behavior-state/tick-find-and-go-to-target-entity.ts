import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { Entity } from '../../entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';

export default function tickFindAndGoToTargetEntity(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getInteraction, getEntitySourceId, getWorldItem } = useWorld();
	const { getBehaviorAction, getInteractableEntitySources } = useBehavior();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId)!;

	if (this.targetEntityId) return true;
	if (this.path.length > 0) return true;
	if (behaviorAction.type === 'idle') return true;

	const worldCharacterEntity = this.worldCharacterEntity;
	const entities = Object.values(worldCharacterEntity.worldContext.entities);

	const interactableEntitySourceIds = new Set(
		getInteractableEntitySources(behaviorAction).map((es) => es.id)
	);

	for (const heldItemId of worldCharacterEntity.heldItemIds) {
		const worldItem = getWorldItem(heldItemId);
		if (worldItem && interactableEntitySourceIds.has(worldItem.item_id)) {
			const heldItemEntityId = EntityIdUtils.createId(
				'item',
				worldCharacterEntity.worldContext.worldId,
				heldItemId
			);
			this.targetEntityId = heldItemEntityId;
			this.path = [];
			return false;
		}
	}

	let candidateEntities: Entity[] = [];

	if (behaviorAction.target_selection_method === 'explicit') {
		const interaction = getInteraction(behaviorAction);
		if (interaction) {
			const entitySourceId = getEntitySourceId(behaviorAction);
			if (!entitySourceId) {
				throw new Error(
					`Explicit target selection requires entity source but none found for behaviorAction: ${behaviorAction.id}`
				);
			}

			candidateEntities = entities.filter((e) => e.sourceId === entitySourceId);
		}
	} else if (
		behaviorAction.target_selection_method === 'search' ||
		behaviorAction.target_selection_method === 'search_or_continue'
	) {
		candidateEntities = entities.filter((e) => interactableEntitySourceIds.has(e.sourceId));
	}

	if (candidateEntities.length > 0) {
		const sortedCandidates = vectorUtils.sortByDistance(worldCharacterEntity, candidateEntities);

		for (const candidate of sortedCandidates) {
			const testPath = worldCharacterEntity.worldContext.pathfinder.findPath(
				worldCharacterEntity,
				candidate
			);
			if (testPath.length > 0) {
				this.targetEntityId = candidate.id;
				this.path = testPath;
				return false;
			}
		}
	}

	return false;
}
