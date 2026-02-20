# 액션 프로세스 기본 구조 수립

## 목표
액션 프로세스의 최소 실행 단위를 정의하고, 명세 기반으로 확장 가능한 기본 구조를 확정한다.

## 담당자
- 플래너
- 게임 디자이너
- 플랫폼 엔지니어
- 테스트 엔지니어

## 할 일
### 게임 디자이너
- [x] `tick-action-*.ts` 파일 골격을 작성한다.
  - [x] `tick-action-once-item-use.ts` 파일을 작성한다.
  - [x] `tick-action-once-building-use.ts` 파일을 작성한다.
  - [x] `tick-action-once-building-construct.ts` 파일을 작성한다.
  - [x] `tick-action-once-building-demolish.ts` 파일을 작성한다.
  - [x] `tick-action-fulfill-building-repair.ts` 파일을 작성한다.
  - [x] `tick-action-fulfill-building-clean.ts` 파일을 작성한다.
  - [x] `tick-action-fulfill-building-use.ts` 파일을 작성한다.
  - [x] `tick-action-fulfill-character-hug.ts` 파일을 작성한다.
  - [x] `tick-action-system-item-pick.ts` 파일 상태를 기준 파일로 점검한다.

### 테스트 엔지니어
- [x] `tick-action-*.spec.ts`와 `create-for-tick-action-*.ts`는 fixture 완결형 패턴으로 작성한다. (`it` 내부 환경 조립 금지, fixture 리턴값만 사용)
- [x] 게임 디자이너가 작성한 각 `tick-action-*.ts` 파일에 대응하는 `tick-action-*.spec.ts` 테스트를 작성한다.
  - [x] `tick-action-once-item-use.spec.ts` 파일을 작성한다.
  - [x] `tick-action-once-building-use.spec.ts` 파일을 작성한다.
  - [x] `tick-action-once-building-construct.spec.ts` 파일을 작성한다.
  - [x] `tick-action-once-building-demolish.spec.ts` 파일을 작성한다.
  - [x] `tick-action-fulfill-building-repair.spec.ts` 파일을 작성한다.
  - [x] `tick-action-fulfill-building-clean.spec.ts` 파일을 작성한다.
  - [x] `tick-action-fulfill-building-use.spec.ts` 파일을 작성한다.
  - [x] `tick-action-fulfill-character-hug.spec.ts` 파일을 작성한다.
  - [x] `tick-action-system-item-pick.spec.ts` 파일 상태를 기준 파일로 점검한다.
- [x] `create-for-tick-action-*.ts` 픽스처 파일 골격을 작성한다.
  - [x] `create-for-tick-action-once-item-use.ts` 파일을 작성한다.
  - [x] `create-for-tick-action-once-building-use.ts` 파일을 작성한다.
  - [x] `create-for-tick-action-once-building-construct.ts` 파일을 작성한다.
  - [x] `create-for-tick-action-once-building-demolish.ts` 파일을 작성한다.
  - [x] `create-for-tick-action-fulfill-building-repair.ts` 파일을 작성한다.
  - [x] `create-for-tick-action-fulfill-building-clean.ts` 파일을 작성한다.
  - [x] `create-for-tick-action-fulfill-building-use.ts` 파일을 작성한다.
  - [x] `create-for-tick-action-fulfill-character-hug.ts` 파일을 작성한다.
  - [x] `create-for-tick-action-system-item-pick.ts` 파일 상태를 기준 파일로 점검한다.

## 노트
### 2026-02-20
- 기준 경로:
  - `behavior`: `/Users/riverleo/ooaah/missions/src/lib/components/app/world/entities/world-character-entity/behavior`
  - `fixture`: `/Users/riverleo/ooaah/missions/src/lib/hooks/fixture/world-character-entity`
- fixture 참고 패턴:
  - `/Users/riverleo/ooaah/missions/src/lib/hooks/fixture/world-character-entity/create-for-tick-find-target-entity-and-go.ts`
- 테스트 작성 원칙:
  - 테스트는 위에서 아래로 읽기 쉬워야 하며, 컨텍스트별 세팅을 독립적으로 유지한다.
  - 테스트 간 공용 래핑 함수/헬퍼로 임의 묶음 재사용을 만들지 않는다.
- 범위:
  - 액션 프로세스의 단계(입력, 판정, 실행, 후처리)와 책임 경계를 정의한다.
  - tick 흐름에서 액션 프로세스가 개입하는 지점을 명세한다.
  - 테스트 가능한 명세 항목을 체크리스트로 정리한다.
- 유의사항:
  - 액션 프로세스 명세는 도메인 행위 중심의 한글 서술형으로 작성한다.
  - 명세에 없는 구현 항목은 추가하지 않는다.
  - 단계별 책임은 중복되지 않게 분리하고, 단계 간 의존성은 명시한다.
  - 예외 처리 규칙은 정상 흐름과 같은 수준으로 명확히 정의한다.
- 메모:
  - 새 요구사항은 우선 본 플랜에 누적 기록하고, 구현은 명시적 진행 요청 이후 수행한다.
