# 🌳 oh-my-worktree

[English](./README.md) | **한국어**

> Git worktree 매니저 — oh-my-* 패밀리에서 영감을 받은 터미널 UI

Git worktree를 쉽게 관리하세요. 설정 기반 자동화, 모노레포 지원, 헬스 체크로 worktree를 생성, 전환, 정리할 수 있습니다.

## 주요 기능

- **TUI 모드** — 인터랙티브 터미널 UI (`omw`)
- **CLI 모드** — 스크립트에서 사용 가능한 커맨드 (`omw add`, `omw list` 등)
- **설정 기반** — 레포별 훅, 파일 복사, 심볼릭 링크
- **모노레포 지원** — 패키지 자동 감지, 패키지별 훅, 포커스 추적
- **헬스 체크** — `omw doctor`로 worktree 문제 진단
- **중앙 집중식 worktree** — 기본적으로 `~/.omw/worktrees/`에 모든 worktree 관리
- **스마트 정리** — 머지된 worktree 자동 감지 및 제거
- **테마** — 6가지 내장 컬러 테마 (OpenCode, Tokyo Night, Dracula, Nord, Catppuccin, GitHub Dark)
- **템플릿** — 재사용 가능한 worktree 프리셋 (`omw add --template review`)
- **크로스 worktree 실행** — 모든 worktree에서 명령 실행 (`omw exec "bun test"`)
- **GitHub PR 연동** — PR에서 worktree 생성 (`omw add --pr 123`)
- **퍼지 브랜치 피커** — TUI에서 타이핑하면 브랜치 자동완성
- **라이프사이클 관리** — 비활성/머지된 worktree 자동 감지, 제한 설정
- **의존성 공유** — `node_modules` 등을 하드링크/심볼릭으로 디스크 절약
- **Worktree 비교** — worktree 간 변경사항 비교 (`omw diff feature/a feature/b`)

## 요구사항

- [Bun](https://bun.sh) 런타임
- git 2.17+
- macOS 또는 Linux
- [gh CLI](https://cli.github.com) (선택사항, `--pr` 플래그용)

## 설치

### Homebrew (macOS/Linux)

```bash
brew tap getsolaris/tap
brew install oh-my-worktree
```

### curl (원라이너)

```bash
curl -fsSL https://raw.githubusercontent.com/getsolaris/oh-my-worktree/main/install.sh | bash
```

### npm / bun

```bash
bun install -g oh-my-worktree
# 또는
npm install -g oh-my-worktree
```

## 빠른 시작

```bash
# TUI 실행
omw

# worktree 목록
omw list

# 새 worktree 생성
omw add feature/my-feature --create

# 모노레포 포커스와 함께 생성
omw add feature/my-feature --create --focus apps/web,apps/api

# GitHub PR에서 생성
omw add --pr 123

# 템플릿 사용
omw add feature/login --create --template review

# 모든 worktree에서 명령 실행
omw exec "bun test"

# 두 worktree 비교
omw diff feature/a feature/b --stat

# 헬스 체크
omw doctor

# worktree 전환 (셸 통합 필요)
omw switch feature/my-feature

# worktree 제거
omw remove feature/my-feature --yes

# 머지된 worktree 정리
omw clean --dry-run
```

## TUI 사용법

`omw` (인자 없이)로 실행합니다.

### 키보드 단축키

| 키 | 동작 |
|----|------|
| `j` / `k` | worktree 목록 탐색 |
| `a` | worktree 추가 |
| `d` | worktree 삭제 |
| `h` | Doctor (헬스 체크) |
| `r` | 목록 새로고침 |
| `Ctrl+P` | 커맨드 팔레트 |
| `?` | 도움말 |
| `q` | 종료 |

### 커맨드 팔레트 (`Ctrl+P`)

검색 가능한 커맨드 메뉴:
- worktree 추가 / 삭제 / 새로고침
- Doctor 실행
- 설정 열기
- 테마 변경
- 종료

타이핑으로 필터, `↑↓`으로 탐색, `Enter`로 실행, `Esc`로 닫기.

### Worktree 생성 흐름

1. `a`를 눌러 생성 뷰 열기
2. 브랜치명 입력 시작 — 타이핑하면 매칭되는 브랜치가 표시됨
3. `↑↓`으로 추천 브랜치 선택, 또는 계속 입력하여 새 브랜치 생성
4. `Tab`으로 Focus 필드 전환 (선택사항)
5. 포커스 경로 입력 (예: `apps/web,apps/api`)
6. `Enter`로 미리보기
7. `Enter`로 확인

퍼지 브랜치 피커는 로컬/리모트 브랜치를 마지막 커밋 날짜 순으로 정렬하여 실시간 필터링합니다.

생성 후 설정된 `copyFiles`, `linkFiles`, `postCreate` 훅, 모노레포 훅이 자동으로 실행됩니다.

### Doctor 뷰

`h`를 눌러 Doctor 탭을 엽니다. 헬스 체크 결과 표시:
- ✓ Git 버전 확인
- ✓ 설정 유효성 검증
- ✓ 비활성 worktree 감지
- ✓ 고아 디렉토리 감지
- ✓ 잠금 상태 확인
- ✓ 더티 worktree 감지

`r`로 재확인, `Esc`로 돌아가기.

## CLI 커맨드

| 커맨드 | 설명 |
|--------|------|
| `omw` | TUI 실행 |
| `omw list` | 모든 worktree 목록 (포커스 정보 포함) |
| `omw add <branch>` | worktree 생성 |
| `omw remove <branch>` | worktree 제거 |
| `omw switch <branch>` | worktree 전환 |
| `omw clean` | 머지된 worktree 제거 |
| `omw doctor` | worktree 헬스 체크 |
| `omw config` | 설정 관리 |
| `omw exec <command>` | 각 worktree에서 명령 실행 |
| `omw diff <ref1> [ref2]` | worktree/브랜치 간 diff |

### `omw add`

```bash
omw add feature/login --create               # 새 브랜치 + worktree 생성
omw add feature/login --create --base main    # main에서 분기
omw add existing-branch                      # 기존 브랜치로 worktree 생성

# 모노레포: 포커스 패키지와 함께 생성
omw add feature/login --create --focus apps/web,apps/api
omw add feature/login --create --focus apps/web --focus apps/api

# 템플릿 사용
omw add feature/login --create --template review

# GitHub PR에서 생성 (gh CLI 필요)
omw add --pr 123
omw add --pr 456 --template review
```

### `omw doctor`

```bash
omw doctor              # 사람이 읽기 쉬운 출력
omw doctor --json       # 스크립팅용 JSON 출력
```

종료 코드: 정상이면 `0`, 경고 또는 에러가 있으면 `1`.

```
oh-my-worktree doctor

✓ Git version: 2.39.0 (>= 2.17 required)
✓ Configuration: valid
✓ Stale worktrees: none
✓ Orphaned directories: none
✓ Worktree locks: all clear
✓ Dirty worktrees: none

All checks passed.
```

### `omw list`

```bash
omw list                # Focus 컬럼이 포함된 테이블
omw list --json         # 포커스 배열이 포함된 JSON
omw list --porcelain    # 머신 판독 가능 형식
```

모노레포 worktree별 포커스 경로를 `Focus` 컬럼에 표시합니다.

### `omw remove`

```bash
omw remove feature/login               # 브랜치명으로 제거
omw remove feature/login --force        # 강제 제거 (더티 worktree)
omw remove feature/login --yes          # 확인 건너뛰기
```

### `omw clean`

```bash
omw clean --dry-run    # 제거될 항목 미리보기
omw clean              # 머지된 worktree 모두 제거
omw clean --stale      # 비활성 worktree도 표시 (lifecycle 설정 사용)
```

### `omw exec`

모든 비-메인 worktree에서 셸 커맨드를 실행합니다.

```bash
omw exec "bun test"                   # 모든 worktree에서 실행 (순차)
omw exec "bun test" --parallel        # 병렬 실행
omw exec "git pull" --all             # 모든 설정된 레포에서 실행
omw exec "bun install" --dirty        # 더티 worktree만
omw exec "git rebase main" --behind   # upstream보다 뒤처진 것만
omw exec "bun test" --json            # JSON 출력
```

| 플래그 | 설명 |
|--------|------|
| `--parallel` / `-p` | 병렬 실행 |
| `--all` / `-a` | 모든 설정된 레포 포함 |
| `--dirty` | 더티 worktree에서만 실행 |
| `--clean` | 클린 worktree에서만 실행 |
| `--behind` | upstream보다 뒤처진 worktree에서만 실행 |
| `--json` / `-j` | 결과를 JSON으로 출력 |

커맨드에서 사용 가능한 환경변수: `OMW_BRANCH`, `OMW_WORKTREE_PATH`, `OMW_REPO_PATH`.

### `omw diff`

두 worktree 브랜치 간 diff를 보여줍니다.

```bash
omw diff feature/a feature/b         # 전체 diff
omw diff feature/a feature/b --stat  # diffstat 요약
omw diff feature/a --name-only       # 변경된 파일명만
omw diff feature/a                   # 현재 HEAD와 비교
```

## 설정

설정 파일: `~/.config/oh-my-worktree/config.json`

초기화: `omw config --init`

### 전체 예시

```json
{
  "$schema": "https://raw.githubusercontent.com/getsolaris/oh-my-worktree/main/schema.json",
  "version": 1,
  "theme": "dracula",
  "defaults": {
    "worktreeDir": "~/.omw/worktrees/{repo}-{branch}",
    "copyFiles": [".env"],
    "linkFiles": ["node_modules"],
    "postCreate": ["bun install"],
    "postRemove": [],
    "sharedDeps": {
      "strategy": "hardlink",
      "paths": ["node_modules"],
      "invalidateOn": ["package.json", "bun.lockb"]
    }
  },
  "templates": {
    "review": {
      "copyFiles": [".env.local"],
      "postCreate": ["bun install", "bun run build"],
      "autoUpstream": true
    },
    "hotfix": {
      "base": "main",
      "copyFiles": [".env.production"],
      "postCreate": ["bun install"]
    },
    "experiment": {
      "worktreeDir": "~/tmp/experiments/{branch}",
      "postRemove": []
    }
  },
  "lifecycle": {
    "autoCleanMerged": true,
    "staleAfterDays": 14,
    "maxWorktrees": 10
  },
  "repos": [
    {
      "path": "/Users/me/dev/frontend",
      "copyFiles": [".env", ".env.local"],
      "linkFiles": ["node_modules", ".next"],
      "postCreate": ["bun install", "bun run build"]
    },
    {
      "path": "/Users/me/dev/backend",
      "copyFiles": [".env"],
      "postCreate": ["pip install -r requirements.txt"]
    },
    {
      "path": "/Users/me/dev/monorepo",
      "copyFiles": [".env"],
      "postCreate": ["pnpm install"],
      "monorepo": {
        "autoDetect": true,
        "extraPatterns": ["apps/*/*"],
        "hooks": [
          {
            "glob": "apps/web",
            "copyFiles": [".env"],
            "postCreate": ["cd {packagePath} && pnpm install"]
          },
          {
            "glob": "apps/api",
            "copyFiles": [".env"],
            "linkFiles": ["node_modules"],
            "postCreate": ["cd {packagePath} && pnpm install && pnpm build"]
          }
        ]
      }
    }
  ]
}
```

### 설정 필드

#### `defaults`

모든 레포가 이 설정을 상속합니다 (레포별 오버라이드 가능).

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `worktreeDir` | `string` | `~/.omw/worktrees/{repo}-{branch}` | worktree 디렉토리 패턴 |
| `copyFiles` | `string[]` | `[]` | 메인 레포에서 복사할 파일 |
| `linkFiles` | `string[]` | `[]` | 심볼릭 링크할 파일/디렉토리 (디스크 절약) |
| `postCreate` | `string[]` | `[]` | worktree 생성 후 실행할 커맨드 |
| `postRemove` | `string[]` | `[]` | worktree 제거 전 실행할 커맨드 |

#### `repos[]`

레포별 오버라이드. 각 항목은 `path`가 필수입니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `path` | `string` | 예 | 레포의 절대 경로 |
| `worktreeDir` | `string` | 아니오 | 기본 worktree 디렉토리 오버라이드 |
| `copyFiles` | `string[]` | 아니오 | 기본 복사 파일 오버라이드 |
| `linkFiles` | `string[]` | 아니오 | 기본 링크 파일 오버라이드 |
| `postCreate` | `string[]` | 아니오 | 기본 postCreate 훅 오버라이드 |
| `postRemove` | `string[]` | 아니오 | 기본 postRemove 훅 오버라이드 |
| `monorepo` | `object` | 아니오 | 모노레포 지원 설정 |

#### `monorepo`

범용 모노레포 지원. 워크스페이스 설정 파일에서 패키지를 자동 감지하고 패키지별 훅을 지원합니다.

```json
{
  "monorepo": {
    "autoDetect": true,
    "extraPatterns": ["apps/*/*"],
    "hooks": [
      {
        "glob": "apps/mobile/*",
        "copyFiles": [".env"],
        "linkFiles": ["node_modules"],
        "postCreate": ["cd {packagePath} && pnpm install"]
      }
    ]
  }
}
```

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `autoDetect` | `boolean` | `true` | 모노레포 도구 자동 감지 |
| `extraPatterns` | `string[]` | `[]` | 패키지 탐색용 추가 glob 패턴 |
| `hooks` | `array` | `[]` | 패키지별 훅 정의 |

**자동 감지** 지원: pnpm workspaces, Turborepo, Nx, Lerna, npm/yarn workspaces.

**`extraPatterns`**는 자동 감지에서 누락된 패키지를 잡습니다. 예를 들어, `pnpm-workspace.yaml`이 `packages/*`만 커버하는데 `apps/frontend/dashboard`에도 앱이 있다면 `extraPatterns: ["apps/*/*"]`를 사용하세요.

#### `monorepo.hooks[]`

포커스 경로에 대해 glob 패턴으로 매칭되는 패키지별 훅.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `glob` | `string` | 예 | 포커스 경로 매칭용 glob (예: `apps/*`, `apps/mobile/*`) |
| `copyFiles` | `string[]` | 아니오 | 매칭된 패키지 디렉토리 내에서 복사할 파일 |
| `linkFiles` | `string[]` | 아니오 | 매칭된 패키지 디렉토리 내에서 심볼릭 링크할 파일/디렉토리 |
| `postCreate` | `string[]` | 아니오 | 생성 후 실행할 커맨드. `{packagePath}`, `{repo}`, `{branch}` 지원 |
| `postRemove` | `string[]` | 아니오 | 제거 전 실행할 커맨드 |

훅은 선언 순서대로 실행되며, 레포 레벨 `postCreate`/`postRemove` 이후에 실행됩니다.

**훅 내 `copyFiles`/`linkFiles`**는 레포 루트가 아닌 **패키지 서브디렉토리**에서 동작합니다. 예를 들어, `glob: "apps/mobile/*"`이고 `copyFiles: [".env"]`이면, `.env` 파일은 `<메인-레포>/apps/mobile/ios/.env`에서 `<worktree>/apps/mobile/ios/.env`로 복사됩니다.

#### `templates`

worktree 생성을 위한 이름이 붙은 프리셋. 각 템플릿은 기본값 필드를 오버라이드할 수 있습니다.

```json
{
  "templates": {
    "review": {
      "copyFiles": [".env.local"],
      "postCreate": ["bun install", "bun run build"],
      "autoUpstream": true
    },
    "hotfix": {
      "base": "main",
      "copyFiles": [".env.production"],
      "postCreate": ["bun install"]
    }
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `worktreeDir` | `string` | worktree 디렉토리 오버라이드 |
| `copyFiles` | `string[]` | 복사할 파일 오버라이드 |
| `linkFiles` | `string[]` | 심볼릭 링크할 파일 오버라이드 |
| `postCreate` | `string[]` | postCreate 훅 오버라이드 |
| `postRemove` | `string[]` | postRemove 훅 오버라이드 |
| `autoUpstream` | `boolean` | upstream 추적 오버라이드 |
| `base` | `string` | `--create`의 기본 베이스 브랜치 |

사용법: `omw add feature/login --create --template review`

템플릿 값은 리졸브된 레포 설정을 오버라이드합니다. `base` 필드는 `--base`가 명시적으로 제공되지 않은 경우 기본값을 설정합니다.

#### `lifecycle`

자동 worktree 라이프사이클 관리. `omw clean --stale`에서 사용됩니다.

```json
{
  "lifecycle": {
    "autoCleanMerged": true,
    "staleAfterDays": 14,
    "maxWorktrees": 10
  }
}
```

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `autoCleanMerged` | `boolean` | `false` | 머지된 worktree를 정리 대상으로 표시 |
| `staleAfterDays` | `number` | — | 비활성으로 표시하기까지 일수 |
| `maxWorktrees` | `number` | — | 이 수를 초과하면 경고 |

#### `sharedDeps`

메인 레포와 worktree 간 의존성을 공유하여 디스크 공간을 절약합니다. `defaults` 또는 레포별로 설정 가능합니다.

```json
{
  "defaults": {
    "sharedDeps": {
      "strategy": "hardlink",
      "paths": ["node_modules"],
      "invalidateOn": ["package.json", "bun.lockb"]
    }
  }
}
```

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `strategy` | `string` | `"symlink"` | `"hardlink"`, `"symlink"`, 또는 `"copy"` |
| `paths` | `string[]` | `[]` | 공유할 디렉토리/파일 |
| `invalidateOn` | `string[]` | `[]` | 변경 시 재공유를 트리거하는 파일 |

**전략:**
- `hardlink` — 각 파일에 하드 링크 생성 (디스크 절약, 다시 쓰여지는 파일은 worktree마다 독립적으로 수정 가능)
- `symlink` — 소스 디렉토리에 심볼릭 링크 생성 (최대 디스크 절약, 상태 공유)
- `copy` — 일반 복사로 폴백

### `--focus` 플래그

worktree가 작업 중인 모노레포 패키지를 추적합니다.

```bash
omw add feature/login --create --focus apps/web,apps/api
```

- 쉼표, 공백, 또는 여러 `--focus` 플래그 지원
- 포커스 메타데이터는 git 내부에 저장 (worktree 루트가 아님)
- `omw list`에서 worktree별 포커스 경로 표시
- 모노레포 훅은 매칭되는 포커스 경로에 대해서만 실행
- 포커스는 선택사항 — 생략하면 일반 worktree 생성

### 템플릿 변수

`worktreeDir` 및 모노레포 훅 커맨드에서 사용 가능:

| 변수 | 설명 | 예시 |
|------|------|------|
| `{repo}` | 레포 디렉토리 이름 | `my-app` |
| `{branch}` | 브랜치 이름 (`/`는 `-`로 대체) | `feature-auth` |
| `{packagePath}` | 매칭된 패키지 경로 (모노레포 훅 전용) | `apps/web` |
| `~` | 홈 디렉토리 (경로 시작 위치에서만) | `/Users/me` |

### 우선순위

레포별 설정은 기본값을 완전히 대체합니다 (머지 없음):

```
repos[].copyFiles 존재?  →  repos[].copyFiles 사용
repos[].copyFiles 없음?  →  defaults.copyFiles 사용
defaults.copyFiles 없음? →  [] (빈 배열) 사용
```

### 테마

설정 파일 또는 커맨드 팔레트 (`Ctrl+P`)에서 설정:

```json
{ "theme": "tokyo-night" }
```

사용 가능: `opencode`, `tokyo-night`, `dracula`, `nord`, `catppuccin`, `github-dark`

## 셸 통합

`omw shell-init`으로 `omw switch`용 셸 통합을 설치하세요.

### 예시

```bash
# zsh
echo 'eval "$(omw shell-init zsh)"' >> ~/.zshrc
source ~/.zshrc

# bash
echo 'eval "$(omw shell-init bash)"' >> ~/.bashrc
source ~/.bashrc

# fish
omw shell-init fish >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

설정 저장 전 생성될 래퍼를 미리 볼 수도 있습니다:

```bash
omw shell-init zsh
```

## 라이선스

MIT © getsolaris
