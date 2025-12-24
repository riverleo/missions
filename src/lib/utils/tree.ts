import { sort } from 'radash';

export class TreeNode {
	readonly id: string;
	readonly position: number[];

	constructor(id: string, position: number[]) {
		this.id = id;
		this.position = position;
	}

	toString(): string {
		return this.position.join('-');
	}
}

export class TreeMap extends Map<string, TreeNode> {
	constructor(items: Record<string, unknown>[], parentIdName: string, orderName: string) {
		super();
		this.build(items, parentIdName, orderName);
	}

	private build(items: Record<string, unknown>[], parentIdName: string, orderName: string) {
		// 부모별로 자식 그룹화
		const childrenByParent = new Map<string | null, Record<string, unknown>[]>();
		for (const item of items) {
			const parentId = (item[parentIdName] as string | null) ?? null;
			const children = childrenByParent.get(parentId) ?? [];
			children.push(item);
			childrenByParent.set(parentId, children);
		}

		// 재귀적으로 위치 계산
		const assignPositions = (parentId: string | null, prefix: number[]) => {
			const children = childrenByParent.get(parentId) ?? [];
			const sortedChildren = sort(children, (c) => (c[orderName] as number) ?? 0);

			sortedChildren.forEach((child, index) => {
				const id = child.id as string;
				const position = [...prefix, index + 1];
				this.set(id, new TreeNode(id, position));
				assignPositions(id, position);
			});
		};

		assignPositions(null, []);
	}
}

/**
 * 트리 구조를 생성합니다.
 *
 * @example
 * const treeMap = toTreeMap(chapters, 'parent_scenario_chapter_id', 'display_order_in_scenario');
 * const node = treeMap.get(chapterId);
 * console.log(node?.toString()); // "1-2"
 */
export function toTreeMap(
	items: Record<string, unknown>[],
	parentIdName: string,
	orderName = 'display_order'
): TreeMap {
	return new TreeMap(items, parentIdName, orderName);
}
