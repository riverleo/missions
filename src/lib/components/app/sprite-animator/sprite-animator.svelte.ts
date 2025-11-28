import type { LoopMode, SpriteAnimation, SpriteMetadata } from './index';

export class SpriteAnimator {
	private atlasName: string;
	private metadata: SpriteMetadata | null = null;
	private animations = new Map<string, SpriteAnimation>();

	currentAnimation = $state<string | null>(null);
	currentFrame = $state(0);

	private constructor(atlasName: string) {
		this.atlasName = atlasName;
	}

	static async create(atlasName: string) {
		const animator = new SpriteAnimator(atlasName);
		await animator.loadMetadata();
		return animator;
	}

	private async loadMetadata() {
		try {
			const metadataModule = await import(`$lib/assets/atlas/generated/${this.atlasName}.json`);
			this.metadata = metadataModule.default;
		} catch (error) {
			console.error(`Failed to load metadata for ${this.atlasName}:`, error);
		}
	}

	init({ name, from, to, fps }: SpriteAnimation) {
		this.animations.set(name, { name, from, to, fps });
	}

	play({ name, loop = 'Loop' }: { name: string; loop?: LoopMode }) {
		const animation = this.animations.get(name);
		if (!animation) {
			console.warn(`Animation "${name}" not found`);
			return;
		}

		this.currentAnimation = name;
		this.currentFrame = animation.from ? animation.from - 1 : 0; // 0-based로 변환
	}
}
