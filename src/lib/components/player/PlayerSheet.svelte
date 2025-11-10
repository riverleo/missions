<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import IconUser from '@tabler/icons-svelte/icons/user';
	import IconSword from '@tabler/icons-svelte/icons/sword';
	import IconShield from '@tabler/icons-svelte/icons/shield';
	import IconHeart from '@tabler/icons-svelte/icons/heart';
	import IconBolt from '@tabler/icons-svelte/icons/bolt';
	import IconBackpack from '@tabler/icons-svelte/icons/backpack';
	import IconTrophy from '@tabler/icons-svelte/icons/trophy';
	import IconHanger from '@tabler/icons-svelte/icons/hanger';
	import IconDiamond from '@tabler/icons-svelte/icons/diamond';
	import IconJacket from '@tabler/icons-svelte/icons/jacket';
	import IconHandGrab from '@tabler/icons-svelte/icons/hand-grab';
	import IconAB from '@tabler/icons-svelte/icons/a-b';
	import IconShirt from '@tabler/icons-svelte/icons/shirt';
	import IconShoe from '@tabler/icons-svelte/icons/shoe';
	import IconCircleDot from '@tabler/icons-svelte/icons/circle-dot';

	type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
	type EquipmentSlot =
		| 'helmet'
		| 'amulet'
		| 'armor'
		| 'gloves'
		| 'belt'
		| 'pants'
		| 'boots'
		| 'weapon'
		| 'offhand'
		| 'ring1'
		| 'ring2';

	interface Equipment {
		id: number;
		name: string;
		rarity: Rarity;
		type: EquipmentSlot;
	}

	interface InventoryItem {
		id: number;
		name: string;
		type: string;
		quantity: number;
		rarity: Rarity;
	}

	// TODO: 실제 데이터는 props나 store에서 가져오기
	let playerData = $state({
		name: '용감한 모험가',
		level: 5,
		experience: 350,
		experienceToNextLevel: 500,
		characterClass: '전사',
		stats: {
			hp: { current: 85, max: 100 },
			mp: { current: 30, max: 50 },
			attack: 25,
			defense: 18,
			speed: 12,
		},
		equipment: {
			helmet: { id: 101, name: '강철 투구', rarity: 'rare', type: 'helmet' } as Equipment | null,
			amulet: null as Equipment | null,
			armor: { id: 102, name: '가죽 갑옷', rarity: 'common', type: 'armor' } as Equipment | null,
			gloves: { id: 103, name: '가죽 장갑', rarity: 'common', type: 'gloves' } as Equipment | null,
			belt: null as Equipment | null,
			pants: null as Equipment | null,
			boots: { id: 104, name: '무쇠 부츠', rarity: 'rare', type: 'boots' } as Equipment | null,
			weapon: { id: 105, name: '강철 검', rarity: 'rare', type: 'weapon' } as Equipment | null,
			offhand: null as Equipment | null,
			ring1: null as Equipment | null,
			ring2: null as Equipment | null,
		},
		inventory: [
			{ id: 1, name: '체력 물약', type: 'consumable', quantity: 3, rarity: 'common' },
			{ id: 2, name: '마나 물약', type: 'consumable', quantity: 5, rarity: 'common' },
			{ id: 3, name: '경험치 부스터', type: 'consumable', quantity: 1, rarity: 'rare' },
			{ id: 10, name: '미스릴 검', type: 'weapon', quantity: 1, rarity: 'epic' },
			{ id: 11, name: '드래곤 갑옷', type: 'armor', quantity: 1, rarity: 'legendary' },
			{ id: 12, name: '마법의 투구', type: 'helmet', quantity: 1, rarity: 'epic' },
			{ id: 13, name: '악마의 목걸이', type: 'amulet', quantity: 1, rarity: 'legendary' },
			{ id: 14, name: '용의 장갑', type: 'gloves', quantity: 1, rarity: 'rare' },
			{ id: 15, name: '전사의 벨트', type: 'belt', quantity: 1, rarity: 'rare' },
			{ id: 16, name: '미스릴 바지', type: 'pants', quantity: 1, rarity: 'epic' },
			{ id: 17, name: '질풍의 부츠', type: 'boots', quantity: 1, rarity: 'epic' },
			{ id: 18, name: '수호자의 방패', type: 'offhand', quantity: 1, rarity: 'rare' },
			{ id: 19, name: '생명의 반지', type: 'ring1', quantity: 1, rarity: 'epic' },
			{ id: 20, name: '힘의 반지', type: 'ring2', quantity: 1, rarity: 'rare' },
		] as InventoryItem[],
	});

	const rarityColors: Record<Rarity, string> = {
		common: 'bg-gray-500',
		rare: 'bg-blue-500',
		epic: 'bg-purple-500',
		legendary: 'bg-orange-500',
	};

	let draggedItem = $state<InventoryItem | Equipment | null>(null);
	let dragSource = $state<'inventory' | EquipmentSlot | null>(null);

	function getSlotIcon(slot: EquipmentSlot) {
		const iconMap = {
			helmet: IconHanger,
			amulet: IconDiamond,
			armor: IconJacket,
			gloves: IconHandGrab,
			belt: IconAB,
			pants: IconShirt,
			boots: IconShoe,
			weapon: IconSword,
			offhand: IconShield,
			ring1: IconCircleDot,
			ring2: IconCircleDot,
		};
		return iconMap[slot];
	}

	function getSlotLabel(slot: EquipmentSlot) {
		const labelMap = {
			helmet: '투구',
			amulet: '목걸이',
			armor: '갑옷',
			gloves: '장갑',
			belt: '벨트',
			pants: '바지',
			boots: '부츠',
			weapon: '무기',
			offhand: '방패',
			ring1: '반지1',
			ring2: '반지2',
		};
		return labelMap[slot];
	}

	function handleDragStart(item: InventoryItem | Equipment, source: 'inventory' | EquipmentSlot) {
		draggedItem = item;
		dragSource = source;
	}

	function handleDragEnd() {
		draggedItem = null;
		dragSource = null;
	}

	function canEquipItem(item: InventoryItem | Equipment, slot: EquipmentSlot): boolean {
		return item.type === slot;
	}

	function handleEquipmentDrop(slot: EquipmentSlot) {
		if (!draggedItem || !dragSource) return;

		// Check if the item can be equipped in this slot
		if (!canEquipItem(draggedItem, slot)) {
			handleDragEnd();
			return;
		}

		if (dragSource === 'inventory') {
			// Moving from inventory to equipment
			const item = draggedItem as InventoryItem;
			const currentEquipped = playerData.equipment[slot];

			// Create equipment item from inventory item
			const newEquipment: Equipment = {
				id: item.id,
				name: item.name,
				rarity: item.rarity,
				type: slot,
			};

			// Equip the new item
			playerData.equipment[slot] = newEquipment;

			// Remove from inventory or decrease quantity
			const inventoryIndex = playerData.inventory.findIndex((i) => i.id === item.id);
			if (inventoryIndex !== -1) {
				if (playerData.inventory[inventoryIndex].quantity > 1) {
					playerData.inventory[inventoryIndex].quantity--;
				} else {
					playerData.inventory.splice(inventoryIndex, 1);
				}
			}

			// If there was an item equipped, add it back to inventory
			if (currentEquipped) {
				const existingInventoryItem = playerData.inventory.find((i) => i.id === currentEquipped.id);
				if (existingInventoryItem) {
					existingInventoryItem.quantity++;
				} else {
					playerData.inventory.push({
						id: currentEquipped.id,
						name: currentEquipped.name,
						type: currentEquipped.type,
						quantity: 1,
						rarity: currentEquipped.rarity,
					});
				}
			}
		} else if (dragSource !== slot) {
			// Swapping between equipment slots
			const sourceItem = draggedItem as Equipment;
			const targetItem = playerData.equipment[slot];

			// Swap the items
			playerData.equipment[slot] = sourceItem;
			playerData.equipment[dragSource] = targetItem as Equipment | null;
		}

		handleDragEnd();
	}

	function handleInventoryDrop() {
		if (!draggedItem || !dragSource || dragSource === 'inventory') {
			handleDragEnd();
			return;
		}

		// Moving from equipment to inventory
		const equippedItem = draggedItem as Equipment;
		const slot = dragSource as EquipmentSlot;

		// Add to inventory
		const existingInventoryItem = playerData.inventory.find((i) => i.id === equippedItem.id);
		if (existingInventoryItem) {
			existingInventoryItem.quantity++;
		} else {
			playerData.inventory.push({
				id: equippedItem.id,
				name: equippedItem.name,
				type: equippedItem.type,
				quantity: 1,
				rarity: equippedItem.rarity,
			});
		}

		// Remove from equipment
		// @ts-ignore - equipment slot accepts null
		playerData.equipment[slot] = null;

		handleDragEnd();
	}
</script>

{#snippet equipmentSlot(slot: EquipmentSlot)}
	{@const equipment = playerData.equipment[slot]}
	{@const SlotIcon = getSlotIcon(slot)}
	<div
		class="relative flex min-h-[90px] flex-col items-center justify-center rounded-lg border-2 p-2 transition-all {draggedItem &&
		canEquipItem(draggedItem, slot)
			? 'border-primary bg-primary/10 shadow-lg'
			: equipment
				? 'border-border bg-accent/30'
				: 'border-dashed border-muted-foreground/30 bg-muted/20'}"
		role="button"
		tabindex="0"
		ondragover={(e) => {
			if (draggedItem && canEquipItem(draggedItem, slot)) {
				e.preventDefault();
			}
		}}
		ondrop={(e) => {
			e.preventDefault();
			handleEquipmentDrop(slot);
		}}
	>
		<div
			class="flex h-full w-full flex-col items-center justify-center gap-1 {equipment
				? 'cursor-grab active:cursor-grabbing'
				: ''}"
			draggable={!!equipment}
			ondragstart={() => equipment && handleDragStart(equipment, slot)}
			ondragend={handleDragEnd}
			role="button"
			tabindex="0"
		>
			<SlotIcon class="size-8 {equipment ? 'text-foreground' : 'text-muted-foreground/50'}" />
			{#if equipment}
				<div class="mt-1 text-center">
					<div class="text-xs leading-tight font-semibold">{equipment.name}</div>
					<Badge variant="secondary" class="mt-1 h-4 text-[10px] {rarityColors[equipment.rarity]}">
						{equipment.rarity}
					</Badge>
				</div>
			{:else}
				<div class="text-[10px] text-muted-foreground">{getSlotLabel(slot)}</div>
			{/if}
		</div>
	</div>
{/snippet}

<Sheet.Root>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon">
				<IconUser class="size-5" />
			</Button>
		{/snippet}
	</Sheet.Trigger>
	<Sheet.Content side="right" class="w-full overflow-y-auto sm:max-w-2xl">
		<Sheet.Header>
			<Sheet.Title>캐릭터 정보</Sheet.Title>
			<Sheet.Description>캐릭터의 스테이터스와 장비를 확인하고 관리하세요.</Sheet.Description>
		</Sheet.Header>

		<Card.Root class="mt-4 w-full">
			<Card.Header>
				<div class="flex items-start justify-between">
					<div class="flex items-center gap-4">
						<div
							class="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
						>
							<IconUser class="size-10 text-primary" />
						</div>
						<div>
							<Card.Title>{playerData.name}</Card.Title>
							<Card.Description>
								{playerData.characterClass} • Lv.{playerData.level}
							</Card.Description>
						</div>
					</div>
					<Badge variant="secondary" class="gap-1">
						<IconTrophy class="size-3" />
						{playerData.experience} / {playerData.experienceToNextLevel} EXP
					</Badge>
				</div>

				<!-- Experience Bar -->
				<div class="space-y-1">
					<div class="flex justify-between text-xs text-muted-foreground">
						<span>경험치</span>
						<span>
							{Math.round((playerData.experience / playerData.experienceToNextLevel) * 100)}%
						</span>
					</div>
					<Progress value={(playerData.experience / playerData.experienceToNextLevel) * 100} />
				</div>
			</Card.Header>

			<Card.Content>
				<Tabs.Root value="character" class="w-full">
					<Tabs.List class="grid w-full grid-cols-2">
						<Tabs.Trigger value="status">스테이터스</Tabs.Trigger>
						<Tabs.Trigger value="character">캐릭터</Tabs.Trigger>
					</Tabs.List>

					<!-- Status Tab -->
					<Tabs.Content value="status" class="space-y-4">
						<!-- HP/MP Bars -->
						<div class="space-y-3">
							<div class="space-y-1">
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2">
										<IconHeart class="size-4 text-red-500" />
										<span class="font-medium">HP</span>
									</div>
									<span class="text-muted-foreground">
										{playerData.stats.hp.current} / {playerData.stats.hp.max}
									</span>
								</div>
								<Progress
									value={(playerData.stats.hp.current / playerData.stats.hp.max) * 100}
									class="[&>div]:bg-red-500"
								/>
							</div>

							<div class="space-y-1">
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2">
										<IconBolt class="size-4 text-blue-500" />
										<span class="font-medium">MP</span>
									</div>
									<span class="text-muted-foreground">
										{playerData.stats.mp.current} / {playerData.stats.mp.max}
									</span>
								</div>
								<Progress
									value={(playerData.stats.mp.current / playerData.stats.mp.max) * 100}
									class="[&>div]:bg-blue-500"
								/>
							</div>
						</div>

						<!-- Stats Grid -->
						<div class="grid grid-cols-3 gap-3">
							<div class="rounded-lg border p-3 text-center">
								<div class="flex items-center justify-center gap-1 text-muted-foreground">
									<IconSword class="size-4" />
								</div>
								<div class="mt-1 text-2xl font-bold">{playerData.stats.attack}</div>
								<div class="text-xs text-muted-foreground">공격력</div>
							</div>
							<div class="rounded-lg border p-3 text-center">
								<div class="flex items-center justify-center gap-1 text-muted-foreground">
									<IconShield class="size-4" />
								</div>
								<div class="mt-1 text-2xl font-bold">{playerData.stats.defense}</div>
								<div class="text-xs text-muted-foreground">방어력</div>
							</div>
							<div class="rounded-lg border p-3 text-center">
								<div class="flex items-center justify-center gap-1 text-muted-foreground">
									<IconBolt class="size-4" />
								</div>
								<div class="mt-1 text-2xl font-bold">{playerData.stats.speed}</div>
								<div class="text-xs text-muted-foreground">속도</div>
							</div>
						</div>
					</Tabs.Content>

					<!-- Character Tab (Equipment + Inventory) -->
					<Tabs.Content value="character" class="py-4">
						<div class="grid gap-4 lg:grid-cols-2">
							<!-- Equipment Grid -->
							<div class="space-y-2">
								<h3 class="text-sm font-semibold text-muted-foreground">장비</h3>
								<div class="grid grid-cols-5 gap-2">
									<!-- Row 1: Helmet -->
									<div></div>
									<div></div>
									{@render equipmentSlot('helmet')}
									<div></div>
									<div></div>

									<!-- Row 2: Weapon, Amulet, Offhand -->
									<div></div>
									{@render equipmentSlot('weapon')}
									{@render equipmentSlot('amulet')}
									{@render equipmentSlot('offhand')}
									<div></div>

									<!-- Row 3: Gloves, Character Avatar, Empty -->
									<div></div>
									{@render equipmentSlot('gloves')}
									<!-- Character Avatar -->
									<div
										class="flex min-h-[90px] items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-2"
									>
										<IconUser class="size-12 text-primary/50" />
									</div>
									<div></div>
									<div></div>

									<!-- Row 4: Ring1, Belt, Ring2 -->
									<div></div>
									{@render equipmentSlot('ring1')}
									{@render equipmentSlot('belt')}
									{@render equipmentSlot('ring2')}
									<div></div>

									<!-- Row 5: Empty, Armor, Pants, Empty -->
									<div></div>
									{@render equipmentSlot('armor')}
									{@render equipmentSlot('pants')}
									<div></div>
									<div></div>

									<!-- Row 6: Boots -->
									<div></div>
									<div></div>
									{@render equipmentSlot('boots')}
									<div></div>
									<div></div>
								</div>
							</div>

							<!-- Inventory -->
							<div class="space-y-2">
								<h3 class="text-sm font-semibold text-muted-foreground">인벤토리</h3>
								<div
									class="min-h-[200px] space-y-2 rounded-lg border-2 border-dashed p-2 transition-colors {draggedItem &&
									dragSource !== 'inventory'
										? 'border-primary/50 bg-primary/5'
										: 'border-transparent'}"
									ondragover={(e) => {
										if (draggedItem && dragSource !== 'inventory') {
											e.preventDefault();
										}
									}}
									ondrop={(e) => {
										e.preventDefault();
										handleInventoryDrop();
									}}
									role="region"
									aria-label="인벤토리"
								>
									{#each playerData.inventory as item (item.id)}
										<div
											class="flex cursor-grab items-center justify-between rounded-lg border p-3 transition-opacity hover:bg-accent/50 active:cursor-grabbing {draggedItem?.id ===
											item.id
												? 'opacity-50'
												: ''}"
											draggable="true"
											ondragstart={() => handleDragStart(item, 'inventory')}
											ondragend={handleDragEnd}
											role="button"
											tabindex="0"
										>
											<div class="flex items-center gap-3">
												<div
													class="flex size-10 items-center justify-center rounded-md {rarityColors[
														item.rarity
													]}"
												>
													<IconBackpack class="size-5 text-white" />
												</div>
												<div>
													<div class="font-medium">{item.name}</div>
													<div class="text-xs text-muted-foreground">{item.type}</div>
												</div>
											</div>
											<div class="text-sm font-semibold">×{item.quantity}</div>
										</div>
									{/each}
									{#if playerData.inventory.length === 0}
										<div class="flex h-[180px] items-center justify-center text-muted-foreground">
											인벤토리가 비어있습니다
										</div>
									{/if}
								</div>
							</div>
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</Card.Content>
		</Card.Root>
	</Sheet.Content>
</Sheet.Root>
