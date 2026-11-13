# Source this to use the project-local toolchain: `source scripts/env.sh`
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
export PATH="$ROOT/.tools/node/bin:$PATH"
export npm_config_cache="$ROOT/.tools/npm-cache"
export PLAYWRIGHT_BROWSERS_PATH="$ROOT/.tools/browsers"
