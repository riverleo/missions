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

	let targetEntity: Entity | undefined = undefined;

	if (behaviorAction.target_selection_method === 'explicit') {
		const interaction = getInteraction(behaviorAction);
		if (interaction) {
			const actionEntitySourceId = getEntitySourceId(behaviorAction);
			if (!actionEntitySourceId) {
				throw new Error(
					`Explicit target selection requires entity source but none found for behaviorAction: ${behaviorAction.id}`
				);
			}

			targetEntity = entities.find((e) => getEntitySourceId(e.id) === actionEntitySourceId);
		}
	} else if (
		behaviorAction.target_selection_method === 'search' ||
		behaviorAction.target_selection_method === 'search_or_continue'
	) {
		const candidateEntities = entities.filter((e) => {
			const entitySourceId = getEntitySourceId(e.id);
			return interactableEntitySourceIds.has(entitySourceId);
		});

		if (candidateEntities.length > 0) {
			const sortedCandidates = candidateEntities.sort((a, b) => {
				const distA = Math.hypot(a.x - worldCharacterEntity.x, a.y - worldCharacterEntity.y);
				const distB = Math.hypot(b.x - worldCharacterEntity.x, b.y - worldCharacterEntity.y);
				return distA - distB;
			});

			for (const candidate of sortedCandidates) {
				const testPath = worldCharacterEntity.worldContext.pathfinder.findPath(
					worldCharacterEntity,
					candidate
				);
				if (testPath.length > 0) {
					targetEntity = candidate;
					break;
				}
			}
		}
	}

	if (targetEntity) {
		const testPath = worldCharacterEntity.worldContext.pathfinder.findPath(
			worldCharacterEntity,
			targetEntity
		);

		if (testPath.length > 0) {
			this.targetEntityId = targetEntity.id;
			this.path = testPath;
		}
	}

	return false;
}
