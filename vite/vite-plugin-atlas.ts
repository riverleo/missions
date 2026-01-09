import { execSync } from 'child_process';
import { watch } from 'fs';
import { readdir, writeFile, rename, unlink } from 'fs/promises';
import { join } from 'path';
import type { Plugin } from 'vite';
import { debounce } from 'radash';
import sharp from 'sharp';
import type { AtlasMetadata, MarkerOffset } from '../src/lib/types/atlas';

interface ImageSize {
	width: number;
	height: number;
}

interface MarkerColor {
	r: number;
	g: number;
	b: number;
}

// 마커 색상
const FACE_MARKER_COLOR: MarkerColor = { r: 255, g: 0, b: 255 }; // 마젠타 #FF00FF
const HAND_MARKER_COLOR: MarkerColor = { r: 0, g: 255, b: 0 }; // 초록 #00FF00

const SOURCES_DIR = './src/lib/assets/atlas/sources';
const GENERATED_DIR = './src/lib/assets/atlas/generated';
const ATLASES_JSON_PATH = join(GENERATED_DIR, 'atlases.json');

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
 * 이미지에서 특정 색상 마커 픽셀들의 중심점 찾기
 * @returns 프레임 중앙 기준 offset, 마커가 없으면 undefined
 */
async function findMarkerOffset(
	imagePath: string,
	markerColor: MarkerColor
): Promise<MarkerOffset | undefined> {
	try {
		const image = sharp(imagePath);
		const { width, height, channels } = await image.metadata();

		if (!width || !height || !channels) return undefined;

		const { data } = await image.raw().toBuffer({ resolveWithObject: true });

		const centerX = width / 2;
		const centerY = height / 2;

		// 모든 마커 픽셀 수집
		const markerPixels: { x: number; y: number }[] = [];

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const idx = (y * width + x) * channels;
				const r = data[idx];
				const g = data[idx + 1];
				const b = data[idx + 2];

				if (r === markerColor.r && g === markerColor.g && b === markerColor.b) {
					markerPixels.push({ x, y });
				}
			}
		}

		if (markerPixels.length === 0) return undefined;

		// 마커 픽셀들의 중심점 계산
		const sumX = markerPixels.reduce((sum, p) => sum + p.x, 0);
		const sumY = markerPixels.reduce((sum, p) => sum + p.y, 0);
		const avgX = sumX / markerPixels.length;
		const avgY = sumY / markerPixels.length;

		return {
			x: Math.round(avgX - centerX),
			y: Math.round(avgY - centerY),
		};
	} catch (error) {
		console.warn(`Failed to find marker in ${imagePath}:`, error);
		return undefined;
	}
}

/**
 * 여러 이미지에서 마커 offset 추출
 * 마커가 없는 프레임은 가장 가까운 마커 있는 프레임의 값 사용
 */
async function extractMarkerOffsets(
	filePaths: string[],
	markerColor: MarkerColor
): Promise<MarkerOffset[] | undefined> {
	// 먼저 모든 프레임의 마커 추출 (없으면 undefined)
	const rawOffsets: (MarkerOffset | undefined)[] = [];

	for (const filePath of filePaths) {
		const offset = await findMarkerOffset(filePath, markerColor);
		rawOffsets.push(offset);
	}

	// 마커가 하나도 없으면 undefined 반환
	const hasAnyMarker = rawOffsets.some((o) => o !== undefined);
	if (!hasAnyMarker) return undefined;

	// 마커 없는 프레임은 가장 가까운 마커 있는 프레임의 값으로 채움
	const offsets: MarkerOffset[] = rawOffsets.map((offset, idx) => {
		if (offset) return offset;

		// 앞뒤로 가장 가까운 마커 찾기
		let nearestOffset: MarkerOffset | undefined;
		let nearestDistance = Infinity;

		for (let i = 0; i < rawOffsets.length; i++) {
			if (rawOffsets[i]) {
				const distance = Math.abs(i - idx);
				if (distance < nearestDistance) {
					nearestDistance = distance;
					nearestOffset = rawOffsets[i];
				}
			}
		}

		return nearestOffset ?? { x: 0, y: 0 };
	});

	return offsets;
}

/**
 * 특정 색상이 마커 색상인지 확인
 */
function isMarkerColor(r: number, g: number, b: number, markerColor: MarkerColor): boolean {
	return r === markerColor.r && g === markerColor.g && b === markerColor.b;
}

/**
 * 이미지에서 모든 마커 픽셀을 투명하게 교체
 */
async function removeMarkerPixels(imagePath: string): Promise<void> {
	const image = sharp(imagePath);
	const { width, height, channels } = await image.metadata();

	if (!width || !height || !channels || channels < 4) return;

	const { data } = await image.raw().toBuffer({ resolveWithObject: true });

	// 마커 픽셀을 투명하게 교체
	let markersRemoved = 0;
	for (let i = 0; i < data.length; i += channels) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		// 얼굴 마커 또는 손 마커인 경우 투명하게
		if (
			isMarkerColor(r!, g!, b!, FACE_MARKER_COLOR) ||
			isMarkerColor(r!, g!, b!, HAND_MARKER_COLOR)
		) {
			// 투명하게 설정 (RGBA)
			data[i] = 0; // R
			data[i + 1] = 0; // G
			data[i + 2] = 0; // B
			data[i + 3] = 0; // A (투명)
			markersRemoved++;
		}
	}

	if (markersRemoved > 0) {
		const tempPath = `${imagePath}.tmp`;
		await sharp(data, { raw: { width, height, channels } }).png().toFile(tempPath);
		await unlink(imagePath);
		await rename(tempPath, imagePath);
	}
}

/**
 * Sprite Sheet 생성 (동일 크기 이미지들)
 */
async function generateSpriteSheet(
	groupName: string,
	files: string[]
): Promise<AtlasMetadata | undefined> {
	const frameCount = files.length;

	// 정사각형 배치
	const columns = Math.ceil(Math.sqrt(frameCount));
	const rows = Math.ceil(frameCount / columns);

	const inputPaths = files.map((f) => `"${f}"`).join(' ');
	const outputPath = join(GENERATED_DIR, `${groupName}.png`);

	const command = `magick montage ${inputPaths} -tile ${columns}x${rows} -geometry +0+0 -background none "${outputPath}"`;
	execSync(command, { stdio: 'inherit' });

	// 프레임 크기 확인 (첫 번째 이미지)
	const firstFile = files[0];
	if (!firstFile) {
		console.warn(`⚠ [${groupName}] No files to process`);
		return undefined;
	}
	const { width: frameWidth, height: frameHeight } = getImageSize(firstFile);

	// 마커에서 얼굴/손 위치 offset 추출
	const faceOffsets = await extractMarkerOffsets(files, FACE_MARKER_COLOR);
	const handOffsets = await extractMarkerOffsets(files, HAND_MARKER_COLOR);

	// 생성된 스프라이트 시트에서 마커 픽셀 제거
	if (faceOffsets || handOffsets) {
		await removeMarkerPixels(outputPath);
	}

	const markerInfo: string[] = [];
	if (faceOffsets) markerInfo.push('face');
	if (handOffsets) markerInfo.push('hand');
	const markerLog = markerInfo.length > 0 ? `, ${markerInfo.join('/')} markers removed` : '';

	console.log(
		`✓ [Sprite Sheet] ${groupName}.png (${frameCount} frames, ${columns}x${rows} grid${markerLog})`
	);

	return {
		name: groupName,
		type: 'sprite',
		frameWidth,
		frameHeight,
		columns,
		rows,
		frameCount,
		step: 1,
		faceOffsets,
		handOffsets,
	};
}

/**
 * Tileset 생성 (가로로 일렬 배치)
 */
async function generateTileset(
	groupName: string,
	files: string[]
): Promise<AtlasMetadata | undefined> {
	const imageCount = files.length;

	// 가로로 일렬 배치 (montage용)
	const montageColumns = imageCount;
	const montageRows = 1;

	const inputPaths = files.map((f) => `"${f}"`).join(' ');
	const outputPath = join(GENERATED_DIR, `${groupName}.png`);

	const command = `magick montage ${inputPaths} -tile ${montageColumns}x${montageRows} -geometry +0+0 -background none "${outputPath}"`;
	execSync(command, { stdio: 'inherit' });

	// 프레임 크기 확인 (첫 번째 이미지)
	const firstFile = files[0];
	if (!firstFile) {
		console.warn(`⚠ [${groupName}] No files to process`);
		return undefined;
	}
	const { width, height } = getImageSize(firstFile);

	// 각 이미지는 4x4 그리드
	// https://www.boristhebrave.com/permanent/24/06/cr31/stagecast/wang/tiles_c.html
	const gridSize = 4;
	const frameWidth = width / gridSize;
	const frameHeight = height / gridSize;

	// 메타데이터: 각 이미지가 4x4 그리드 (16개 타일)
	const columns = imageCount * gridSize;
	const rows = gridSize;
	const frameCount = imageCount * gridSize * gridSize;

	console.log(`✓ [Tileset] ${groupName}.png (${frameCount} tiles, ${columns}x${rows} grid)`);

	return {
		name: groupName,
		type: 'tileset',
		frameWidth,
		frameHeight,
		columns,
		rows,
		frameCount,
		step: gridSize,
	};
}

/**
 * 특정 그룹의 Atlas 생성
 */
async function generateAtlas(groupName: string): Promise<AtlasMetadata | undefined> {
	try {
		const groupPath = join(SOURCES_DIR, groupName);

		// 폴더 내 이미지 파일들 수집
		const allFiles = await readdir(groupPath);
		const imageFiles = allFiles.filter(isImageFile);

		if (imageFiles.length === 0) {
			console.warn(`⚠ [${groupName}] No image files found`);
			return undefined;
		}

		// 파일명 정렬
		const sortedFiles = sortByNumber(imageFiles);
		const filePaths = sortedFiles.map((f) => join(groupPath, f));

		// 타일셋 감지: 폴더명이 "tile-"로 시작하면 타일셋으로 표시
		const isTileset = groupName.startsWith('tile-');

		if (isTileset) {
			return await generateTileset(groupName, filePaths);
		} else {
			return await generateSpriteSheet(groupName, filePaths);
		}
	} catch (error) {
		console.error(`Failed to generate atlas for ${groupName}:`, error);
		return undefined;
	}
}

/**
 * 모든 Atlas 생성 및 메타데이터 저장
 */
async function generateAtlases() {
	try {
		// sources 폴더의 하위 폴더들 탐색
		const groups = await readdir(SOURCES_DIR, { withFileTypes: true });
		const atlases: Record<string, AtlasMetadata> = {};

		for (const group of groups) {
			if (!group.isDirectory()) continue;
			const metadata = await generateAtlas(group.name);
			if (metadata) {
				atlases[metadata.name] = metadata;
			}
		}

		// 전체 메타데이터를 하나의 파일로 저장
		await writeFile(ATLASES_JSON_PATH, JSON.stringify(atlases, null, 2));
		console.log(`✓ [Metadata] atlases.json (${Object.keys(atlases).length} atlases)`);
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
			// 전체 재생성 debounce
			const debouncedGenerateAll = debounce({ delay: 300 }, async () => {
				await generateAtlases();

				// HMR 트리거
				server.ws.send({
					type: 'full-reload',
					path: '*',
				});
			});

			// 개발 모드: sources 폴더 watch
			const watcher = watch(SOURCES_DIR, { recursive: true }, (eventType, filename) => {
				if (!filename || !isImageFile(filename)) return;

				console.log(`\n📦 Atlas source changed: ${filename}`);
				debouncedGenerateAll();
			});

			// 서버 시작 시 한 번 생성
			generateAtlases();

			server.httpServer?.on('close', () => {
				watcher.close();
			});
		},
	};
}
