# 미니게임천국

> 업무 화면으로 위장한 미니게임 포털

직장인처럼 보이지만 사실은 게임 중. 엑셀, 구글 시트, VS Code 화면 속에 숨겨진 미니게임들을 즐겨보세요.

## 배포

👉 [https://queryjin.netlify.app](https://queryjin.netlify.app)

## 게임 목록

| 위장 화면 | 실제 게임 |
|-----------|-----------|
| Excel 스프레드시트 | 스도쿠 |
| Google Sheets | 테트리스 |
| VS Code 에디터 | 영문 추리게임 (범인 찾기) |
| 준비 중... | (추가 예정) |

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **DB / 로그**: Supabase (PostgreSQL)
- **배포**: Netlify

## 로컬 실행

```bash
npm install
# .env.local 파일 생성 후 Supabase 환경변수 입력 (.env.local.example 참고)
npm run dev
```

## 환경변수

`.env.local.example`을 참고해 `.env.local` 파일을 만드세요.

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## DB 설정

`supabase/schema.sql`을 Supabase SQL Editor에서 실행하면 테이블과 RLS 정책이 생성됩니다.

## 로그 확인

`/admin/logs` 에서 게임별 접속 기록을 확인할 수 있습니다.

## 게임 추가 방법

1. `app/games/<게임명>/page.tsx` 생성
2. `app/page.tsx` 허브 화면에 `GameCard` 추가
3. `lib/logger.ts`의 `logGameEvent()` 호출로 로그 연동

## 🔍 Code Reviewer — 플레이 가이드

> VS Code 화면으로 위장한 영문 추리게임입니다.

**목표:** Senior Dev Victor Harmon의 사망 사건을 수사해 범인을 찾아내세요.

**기본 조작:**
- 에디터 하단의 함수 버튼 클릭 → 다음 장면으로 이동
- 좌측 파일 탐색기 → 방문한 파일 확인 및 재방문
- 하단 터미널 → 수사 기록 로그

**Tool 획득 시스템:**
- 각 장면에서 mini-puzzle을 풀면 도구(Tool)를 획득합니다
- `KEYCARD_DATA` — 현장 감식 장면에서 획득
- `USB_KEY` — USB 분석 장면에서 획득 (git log에 단서 있음)
- 일부 장면은 특정 Tool이 있어야만 입장 가능합니다

**랭킹:**
- 첫 번째 선택부터 정답까지 걸린 시간으로 순위를 매깁니다
- 정답을 맞추면 닉네임과 함께 랭킹 등록 가능

**Hint:** The answer is hidden in the digital fingerprints, not the physical ones.
