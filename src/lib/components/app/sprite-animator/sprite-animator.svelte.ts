import type { LoopMode, SpriteAnimation, SpriteMetadata } from './index';

const DEFAULT_FPS = 24;
const DEFAULT_FRAME_COUNT = 1;

export class SpriteAnimator {
	private atlasName: string;
	private metadata: SpriteMetadata | undefined = undefined;
	private animations = new Map<string, SpriteAnimation>();
	private frameTimer: NodeJS.Timeout | undefined = undefined;
	private direction: 1 | -1 = 1;

	currentAnimation = $state<string | undefined>(undefined);
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

	play({
		name,
		loop = 'loop',
		onLoop,
		onComplete,
	}: {
		name: string;
		loop?: LoopMode;
		onLoop?: () => void;
		onComplete?: () => void;
	}) {
		const animation = this.animations.get(name);
		if (!animation) {
			console.warn(`Animation "${name}" not found`);
			return;
		}

		// 이전 애니메이션 정지
		this.stop();

		this.currentAnimation = name;
		this.currentFrame = animation.from ? animation.from - 1 : 0; // 0-based로 변환
		this.direction = 1; // 항상 정방향으로 시작

		// 프레임 업데이트 시작
		this.startFrameUpdate(animation, loop, onLoop, onComplete);
	}

	private startFrameUpdate(
		animation: SpriteAnimation,
		loop: LoopMode,
		onLoop?: () => void,
		onComplete?: () => void
	) {
		const fps = animation.fps ?? DEFAULT_FPS;
		const frameDelay = 1000 / fps;
		const from = animation.from ? animation.from - 1 : 0;
		const to = animation.to ? animation.to - 1 : (this.metadata?.frameCount ?? DEFAULT_FRAME_COUNT) - 1;

		const updateFrame = () => {
			// 다음 프레임으로 이동
			this.currentFrame += this.direction;

			// 루프 처리
			if (loop === 'loop') {
				if (this.currentFrame > to) {
					this.currentFrame = from;
					onLoop?.();
				}
			} else if (loop === 'once') {
				if (this.currentFrame > to) {
					this.currentFrame = to;
					this.stop();
					onComplete?.();
					return;
				}
			} else if (loop === 'ping-pong') {
				if (this.currentFrame > to) {
					this.currentFrame = to - 1;
					this.direction = -1;
				} else if (this.currentFrame < from) {
					this.currentFrame = from + 1;
					this.direction = 1;
					onLoop?.();
				}
			} else if (loop === 'ping-pong-once') {
				if (this.direction === 1 && this.currentFrame > to) {
					this.currentFrame = to - 1;
					this.direction = -1;
				} else if (this.direction === -1 && this.currentFrame < from) {
					this.currentFrame = from;
					this.stop();
					onComplete?.();
					return;
				}
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
