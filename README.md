## 주요 기능

### Atlas 자동 생성 시스템

프로크리에이트에서 애니메이션 레이어를 추출하면 자동으로 스프라이트 시트 또는 패킹된 아틀라스를 생성합니다.

#### 작업 진행

1. **프로크리에이트에서 레이어 추출**
   - 애니메이션 레이어를 `[이름]-1.png`, `[이름]-2.png` 형식으로 추출

2. **소스 폴더에 배치**
   - `src/lib/assets/atlas/sources/[그룹명]/` 폴더에 이미지 배치
   - `.sprite` 또는 `.packed` 파일로 아틀라스 타입 지정

3. **자동 생성**
   - Vite 플러그인(`vite-plugin-atlas.ts`)이 변경을 감지하여 자동으로 아틀라스 생성
   - `src/lib/assets/atlas/generated/` 폴더에 PNG + JSON 메타데이터 생성

## 개발 환경

### 필수 도구

- **ImageMagick**: 아틀라스 생성에 사용

  ```sh
  brew install imagemagick
  ```

- **pnpm**: 패키지 매니저
  ```sh
  npm install -g pnpm
  ```

### 의존성 설치

```sh
pnpm install
```

### 개발 서버 시작

```sh
pnpm dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 빌드

```sh
pnpm build
```

프로덕션 빌드를 미리보기:

```sh
pnpm preview
```

## 프로젝트 구조

```
src/
├── lib/
│   ├── assets/
│   │   └── atlas/
│   │       ├── sources/        # 원본 이미지 (Git 추적)
│   │       │   ├── test/
│   │       │   │   ├── .sprite
│   │       │   │   ├── test-1.png
│   │       │   │   └── ...
│   │       │   └── ui/
│   │       │       ├── .packed
│   │       │       └── ...
│   │       └── generated/      # 생성된 아틀라스 (Git 추적)
│   │           ├── test.png
│   │           ├── test.json
│   │           └── ...
│   └── components/
│       └── app/
│           └── sprite-animator/
│               ├── sprite-animator.svelte.ts
│               ├── sprite-animator-renderer.svelte
│               └── index.ts
└── routes/
    └── (app)/
        └── +page.svelte

vite/
└── vite-plugin-atlas.ts        # Atlas 자동 생성 플러그인
```

## 기술 스택

- **SvelteKit**: 풀스택 프레임워크
- **Svelte 5**: 최신 runes API 활용
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **Vite**: 빌드 도구
- **ImageMagick**: 이미지 처리
- **potpack**: 텍스처 패킹 알고리즘

## 배포

Vercel에 배포되며, 생성된 아틀라스 파일들도 Git에 포함되어 빌드 시 ImageMagick 설치가 필요하지 않습니다.
