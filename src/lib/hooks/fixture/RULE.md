# Fixture Rules

이 문서는 `/src/lib/hooks/fixture` 유틸 작성/수정 시 지켜야 할 규칙을 정의한다.

## 1. 함수 네이밍

- 월드 컨텍스트 단일 데이터는 `createOrGet*` 패턴을 사용한다.
- 예시: `createOrGetWorld`, `createOrGetScenario`, `createOrGetPlayer`
- 특정 테스트 대상 데이터(`A`, `B`)는 `createOrGetCharacterA`처럼 접근용 헬퍼로 제공한다.
- `create*`는 연결 관계가 명확한 엔티티 생성(예: world_character, world_character_need)에만 사용한다.

## 2. 스토어 쓰기 규칙

- `set(...)`: 단일 컨텍스트 데이터 덮어쓰기
- 대상: world, scenario, player
- `add(...)`: 누적 엔티티 데이터 병합
- 대상: character, character_body, need, behavior, item, building, world_character, world_character_need 등

## 3. FK(관계) 생성 규칙

- FK는 랜덤으로 만들지 않는다.
- 상위 엔티티를 인자로 받아 FK를 채운다.
- 예시:
  - `createWorldCharacter(character, overrides?)`
  - `createWorldCharacterNeed(worldCharacter, need, overrides?)`

## 4. 유니크 충돌 처리

- 유니크 조건에 부합하는 데이터가 이미 존재하면 새로 만들지 않고 기존 레코드를 반환한다.
- 최소한 아래 함수는 이 규칙을 지켜야 한다.
  - `createWorldCharacter`
  - `createWorldCharacterNeed`

## 5. ID/이름 규칙

- ID는 `uuidv4()`로 생성한다.
- 표시용 이름/타이틀은 별도 랜덤을 만들지 않고, 생성된 ID prefix를 사용한다.
- 형식: `getIdPrefix(prefix, id)`
- 예시: `getIdPrefix('character', characterId)` -> `character-xxxxxxxx`

## 6. 테스트 사용 규칙

- 테스트 시작 시 fixture 데이터는 비어있다고 가정한다.
- 초기화는 `Fixture.reset()`에서만 수행한다.
- 개별 `create*/createOrGet*` 함수 내부에서 스토어 초기화를 수행하지 않는다.

## 7. 구현 금지 사항

- `as any` 사용 금지
- 강제 타입 캐스팅으로 엔티티를 흉내내지 말고 실제 생성 유틸을 통해 데이터 구성
- 동일 의미의 중복 헬퍼 추가 금지 (기존 유틸 재사용 우선)
