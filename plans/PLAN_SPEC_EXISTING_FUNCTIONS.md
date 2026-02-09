# Spec 작성: 기존 함수들

**목표**: 이미 구현되어 잘 동작하는 함수들에 대해 Spec-Driven Development 명세 체크리스트 작성 및 테스트 검증

**대상 함수**:
- `tickDecreaseNeeds` (world-character-entity)
- `updateDirection` (behavior-state)
- `updateMove` (behavior-state)

---

## 작업 순서

### 1. tickDecreaseNeeds 명세 작성
- [x] 함수 주석에 체크리스트 형태 명세 추가
  - [x] 모든 욕구를 순회하며 감소 처리
  - [x] 욕구 정보가 없으면 건너뛰기
  - [x] 캐릭터 욕구 정보가 없으면 건너뛰기
  - [x] decrease_per_tick * decay_multiplier 만큼 감소
  - [x] 최소값 0으로 제한
- [x] 명세에 맞춰 테스트 작성 (`tick-decrease-needs.spec.ts`)
- [x] `pnpm test:unit` 검증 (5/5 통과)

### 2. updateDirection 명세 작성
- [x] 함수 주석에 체크리스트 형태 명세 추가
  - [x] 경로가 비어있으면 아무것도 하지 않기
  - [x] 경로에서 방향이 바뀌는 첫 지점 찾기
  - [x] 방향 전환 지점이 없으면 경로 끝을 사용
  - [x] 세그먼트 끝점과 현재 위치의 x 차이로 방향 결정
  - [x] threshold(5px) 이내면 방향 변경 안함
- [x] 명세에 맞춰 테스트 작성 (`update-direction.spec.ts`)
- [x] `pnpm test:unit` 검증 (5/5 통과)

### 3. updateMove 명세 작성
- [x] 함수 주석에 체크리스트 형태 명세 추가
  - [x] 경로가 비어있으면 body를 dynamic으로 전환
  - [x] 경로가 있으면 body를 static으로 전환
  - [x] 경로의 첫 번째 지점을 목표로 설정
  - [x] 목표까지 거리 계산
  - [x] arrivalThreshold(5px) 이내면 경로에서 제거
  - [x] X축 우선 이동
  - [x] X축 이동 중에는 Y축 고정
  - [x] X축 완료 후 Y축 이동
  - [x] speed(200) * deltaSeconds 만큼 이동
  - [x] 목표 지점 오버슈팅 방지
- [x] 명세에 맞춰 테스트 작성 (`update-move.spec.ts`)
- [x] `pnpm test:unit` 검증 (10/10 통과)

---

## 완료 조건
- [x] 모든 함수에 체크리스트 형태 명세 추가됨
- [x] 모든 명세 항목에 대응하는 테스트 작성됨
- [x] `pnpm test:unit` 전체 통과 (총 20/20 테스트)
- [x] `pnpm check` 에러 없음

---

## 참고사항
- 명세 항목 텍스트 = it 이름 (정확히 일치 필수)
- `describe('함수명(파라미터: 타입)', ...)` 형식
- 명세 계층 = describe 계층
- 이미 구현된 코드를 검증하는 작업이므로 코드 수정은 최소화
