#!/usr/bin/env bash
# Build the release packages with the OpenWrt SDK in Docker (as CI does):
#   .dev/scripts/build-packages.sh [ipk|apk|all]
# htdocs/ is not in git: the script builds it first (pnpm build), unless
# SKIP_WEB=1 says it is already built.
# Output: dist/ with the SDK's own file names and dist/sha256sums.txt.
# The names stay as the SDK writes them (luci-theme-outline_1.1.0-r1_all.ipk,
# luci-theme-outline-1.1.0-r1.apk): install.sh and the Package page find the
# package and read its version from them.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="$(sed -n 's/^PKG_VERSION:=//p' "$ROOT/Makefile")"
OUT="$ROOT/dist"
WHAT="${1:-all}"
IPK_SDK="${IPK_SDK:-itdoginfo/openwrt-sdk-ipk:24.10.6}"
APK_SDK="${APK_SDK:-itdoginfo/openwrt-sdk-apk:25.12.3}"

# One version everywhere: the Makefile and .dev/package.json.
grep -q "\"version\": \"$VERSION\"" "$ROOT/.dev/package.json" || { echo ".dev/package.json version != $VERSION" >&2; exit 1; }

[ "${SKIP_WEB:-0}" = 1 ] || (cd "$ROOT/.dev" && pnpm install --frozen-lockfile && pnpm build)
[ -f "$ROOT/htdocs/luci-static/outline/main.css" ] || { echo "htdocs/ is not built (pnpm build in .dev/)" >&2; exit 1; }

mkdir -p "$OUT"
build() {
	local type="$1" sdk="$2" tag="outline-build:$1"
	docker build --platform linux/amd64 -f "$ROOT/.dev/build/Dockerfile" --build-arg "SDK_IMAGE=$sdk" -t "$tag" "$ROOT"
	local id
	id="$(docker create "$tag")"
	rm -rf "$OUT/.$type" && mkdir -p "$OUT/.$type"
	docker cp "$id:/builder/out/." "$OUT/.$type/"
	docker rm "$id" >/dev/null
	local f
	f="$(find "$OUT/.$type" -type f -name "luci-theme-outline*$VERSION*.$type" | head -n1)"
	[ -n "$f" ] || { echo "no .$type of $VERSION built" >&2; exit 1; }
	rm -f "$OUT"/luci-theme-outline*."$type"
	mv "$f" "$OUT/"
	rm -rf "$OUT/.$type"
	echo "$OUT/$(basename "$f")"
}

case "$WHAT" in
ipk) build ipk "$IPK_SDK" ;;
apk) build apk "$APK_SDK" ;;
all) build ipk "$IPK_SDK"; build apk "$APK_SDK" ;;
*) echo "usage: $0 [ipk|apk|all]" >&2; exit 2 ;;
esac

(
	cd "$OUT"
	set -- luci-theme-outline*.ipk luci-theme-outline*.apk
	files=""
	for f in "$@"; do [ -f "$f" ] && files="$files $f"; done
	# shellcheck disable=SC2086
	if command -v sha256sum >/dev/null; then sha256sum $files; else shasum -a 256 $files; fi > sha256sums.txt
)
cat "$OUT/sha256sums.txt"
