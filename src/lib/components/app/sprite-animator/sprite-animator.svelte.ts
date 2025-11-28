import type { LoopMode, SpriteAnimation, SpriteMetadata } from './index';

export class SpriteAnimator {
	private atlasName: string;
	private metadata: SpriteMetadata | undefined = undefined;
	private animations = new Map<string, SpriteAnimation>();
	private frameTimer: NodeJS.Timeout | undefined = undefined;

	currentAnimation = $state<string | undefined>(undefined);
	currentFrame = $state(0);
	currentLoop: LoopMode = 'loop';

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

	play({ name, loop = 'loop' }: { name: string; loop?: LoopMode }) {
		const animation = this.animations.get(name);
		if (!animation) {
			console.warn(`Animation "${name}" not found`);
			return;
		}

		// 이전 애니메이션 정지
		this.stop();

		this.currentAnimation = name;
		this.currentLoop = loop;
		this.currentFrame = animation.from ? animation.from - 1 : 0; // 0-based로 변환

		// 프레임 업데이트 시작
		this.startFrameUpdate(animation);
	}

	private startFrameUpdate(animation: SpriteAnimation) {
		const fps = animation.fps ?? 12;
		const frameDelay = 1000 / fps;
		const from = animation.from ? animation.from - 1 : 0;
		const to = animation.to ? animation.to - 1 : (this.metadata?.frameCount ?? 1) - 1;

		const updateFrame = () => {
			// 다음 프레임으로 이동
			this.currentFrame++;

			// 루프 처리
			if (this.currentFrame > to) {
				if (this.currentLoop === 'loop') {
					this.currentFrame = from;
				} else if (this.currentLoop === 'once') {
					this.currentFrame = to;
					this.stop();
					return;
				}
				// TODO: ping-pong, ping-pong-once 구현
			}

			this.frameTimer = setTimeout(updateFrame, frameDelay);
		};

		this.frameTimer = setTimeout(updateFrame, frameDelay);
	}

	stop() {
		if (this.frameTimer) {
			clearTimeout(this.frameTimer);
			this.frameTimer = undefined;
		}
	}

	getMetadata() {
		return this.metadata;
	}

	getAtlasUrl() {
		return `/src/lib/assets/atlas/generated/${this.atlasName}.png`;
	}
}
