import { execSync } from 'child_process';
import { watch } from 'fs';
import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { Plugin } from 'vite';
import potpack from 'potpack';
import { debounce } from 'radash';

interface ImageSize {
	width: number;
	height: number;
}

interface Box {
	w: number;
	h: number;
	x?: number;
	y?: number;
	filename: string;
}

const SOURCES_DIR = './src/lib/assets/atlas/sources';
const GENERATED_DIR = './src/lib/assets/atlas/generated';

/**
 * ImageMagick identify로 이미지 크기 확인
 */
function getImageSize(imagePath: string): ImageSize {
	const output = execSync(`magick identify -format "%wx%h" "${imagePath}"`, {
		encoding: 'utf-8',
	}).trim();
	const parts = output.split('x').map(Number);
	const width = parts[0] ?? 0;
	const height = parts[1] ?? 0;
	return { width, height };
}

/**
 * 이미지 파일 확인
 */
function isImageFile(filename: string): boolean {
	return /\.(png|webp|jpe?g)$/i.test(filename);
}

/**
 * 파일명에서 숫자 추출해서 정렬
 */
function sortByNumber(files: string[]): string[] {
	return files.sort((a, b) => {
		const numA = parseInt(a.match(/-(\d+)\.(png|webp|jpe?g)$/i)?.[1] || '0');
		const numB = parseInt(b.match(/-(\d+)\.(png|webp|jpe?g)$/i)?.[1] || '0');
		return numA - numB;
	});
}

/**
 * Sprite Sheet 생성 (동일 크기 이미지들)
 */
async function generateSpriteSheet(groupName: string, files: string[]) {
	const frameCount = files.length;
	const columns = Math.ceil(Math.sqrt(frameCount));
	const rows = Math.ceil(frameCount / columns);

	const inputPaths = files.join(' ');
	const outputPath = join(GENERATED_DIR, `${groupName}.png`);

	const command = `magick montage ${inputPaths} -tile ${columns}x${rows} -geometry +0+0 -background none ${outputPath}`;
	execSync(command, { stdio: 'inherit' });

	// 프레임 크기 확인 (첫 번째 이미지)
	const firstFile = files[0];
	if (!firstFile) {
		console.warn(`⚠ [${groupName}] No files to process`);
		return;
	}
	const { width: frameWidth, height: frameHeight } = getImageSize(firstFile);

	// 메타데이터 생성
	const metadata = {
		type: 'sprite',
		frameWidth,
		frameHeight,
		columns,
		rows,
		frameCount,
	};

	const metadataPath = join(GENERATED_DIR, `${groupName}.json`);
	await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

	console.log(
		`✓ [Sprite Sheet] ${groupName}.png + ${groupName}.json (${frameCount} frames, ${columns}x${rows} grid)`
	);
}

/**
 * Packed Atlas 생성 (다른 크기 이미지들)
 */
async function generatePackedAtlas(groupName: string, files: string[]) {
	// 1. 각 이미지의 크기 확인
	const boxes: Box[] = files.map((file) => {
		const size = getImageSize(file);
		return {
			w: size.width,
			h: size.height,
			filename: file,
		};
	});

	// 2. potpack으로 좌표 계산
	const { w: atlasWidth, h: atlasHeight } = potpack(boxes);

	// 3. ImageMagick으로 이미지 합성
	const outputPath = join(GENERATED_DIR, `${groupName}.png`);

	// 빈 캔버스 생성
	execSync(`magick -size ${atlasWidth}x${atlasHeight} xc:none "${outputPath}"`, {
		stdio: 'inherit',
	});

	// 각 이미지를 계산된 위치에 합성
	for (const box of boxes) {
		execSync(
			`magick composite -geometry +${box.x}+${box.y} "${box.filename}" "${outputPath}" "${outputPath}"`,
			{ stdio: 'inherit' }
		);
	}

	// 4. 메타데이터 JSON 생성
	const frames: Record<string, { x: number; y: number; width: number; height: number }> = {};
	for (const box of boxes) {
		const filename = box.filename.split('/').pop()!;
		// 확장명 제거
		const nameWithoutExt = filename.replace(/\.(png|webp|jpe?g)$/i, '');
		frames[nameWithoutExt] = {
			x: box.x!,
			y: box.y!,
			width: box.w,
			height: box.h,
		};
	}

	const metadata = {
		type: 'packed',
		frames,
	};

	const metadataPath = join(GENERATED_DIR, `${groupName}.json`);
	await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

	console.log(
		`✓ [Packed Atlas] ${groupName}.png + ${groupName}.json (${files.length} images, ${atlasWidth}x${atlasHeight})`
	);
}

/**
 * 특정 그룹의 Atlas 생성
 */
async function generateAtlas(groupName: string) {
	try {
		const groupPath = join(SOURCES_DIR, groupName);

		// 폴더 내 이미지 파일들 수집
		const allFiles = await readdir(groupPath);
		const imageFiles = allFiles.filter(isImageFile);

		if (imageFiles.length === 0) {
			console.warn(`⚠ [${groupName}] No image files found`);
			return;
		}

		// 파일명 정렬
		const sortedFiles = sortByNumber(imageFiles);
		const filePaths = sortedFiles.map((f) => join(groupPath, f));

		// 타입 파일 확인 (.sprite 또는 .packed)
		const hasSprite = allFiles.includes('.sprite');
		const hasPacked = allFiles.includes('.packed');

		if (hasSprite && hasPacked) {
			console.warn(`⚠ [${groupName}] Both .sprite and .packed found, using .sprite`);
			await generateSpriteSheet(groupName, filePaths);
		} else if (hasSprite) {
			await generateSpriteSheet(groupName, filePaths);
		} else if (hasPacked) {
			await generatePackedAtlas(groupName, filePaths);
		} else {
			console.warn(`⚠ [${groupName}] No .sprite or .packed file found, skipping`);
		}
	} catch (error) {
		console.error(`Failed to generate atlas for ${groupName}:`, error);
	}
}

/**
 * 모든 Atlas 생성
 */
async function generateAtlases() {
	try {
		// sources 폴더의 하위 폴더들 탐색
		const groups = await readdir(SOURCES_DIR, { withFileTypes: true });

		for (const group of groups) {
			if (!group.isDirectory()) continue;
			await generateAtlas(group.name);
		}
	} catch (error) {
		console.error('Failed to generate atlases:', error);
	}
}

/**
 * Atlas 자동 생성 Vite 플러그인
 */
export function atlasPlugin(): Plugin {
	return {
		name: 'vite-plugin-atlas',

		configureServer(server) {
			// 그룹별 debounce 맵
			const debouncedGenerators = new Map<string, ReturnType<typeof debounce>>();

			// 개발 모드: sources 폴더 watch
			const watcher = watch(SOURCES_DIR, { recursive: true }, (eventType, filename) => {
				if (!filename || !isImageFile(filename)) return;

				// 변경된 파일의 그룹명 추출
				const groupName = filename.split('/')[0];
				if (!groupName) return;

				console.log(`\n📦 Atlas source changed: ${filename}`);

				// 그룹별 debounce 생성 (없으면)
				if (!debouncedGenerators.has(groupName)) {
					debouncedGenerators.set(
						groupName,
						debounce({ delay: 300 }, async () => {
							await generateAtlas(groupName);

							// HMR 트리거
							server.ws.send({
								type: 'full-reload',
								path: '*',
							});
						})
					);
				}

				// 해당 그룹의 debounced 함수 실행
				debouncedGenerators.get(groupName)?.();
			});

			// 서버 시작 시 한 번 생성
			generateAtlases();

			server.httpServer?.on('close', () => {
				watcher.close();
			});
		},
	};
}
