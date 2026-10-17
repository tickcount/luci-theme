#!/bin/sh
# shellcheck shell=dash
# Install, update or remove luci-theme-outline on an OpenWrt router.
#
#   wget -qO- https://raw.githubusercontent.com/tickcount/luci-theme-outline/master/install.sh | sh
#
# Options (after `sh -s --` when piped):
#   --version vX.Y.Z   install that release instead of the latest
#   --no-activate      install without switching LuCI to Outline
#   --uninstall        remove the theme; its settings stay in /etc/config/outline
#   --purge            remove the theme, its settings and uploaded brand images
#
# Run on the router as root. Works with opkg (OpenWrt ≤ 24.10) and apk
# (25.12+). Later updates can also be installed from LuCI:
# System › Outline Theme › Package.

set -e

REPO="${OUTLINE_REPO:-tickcount/luci-theme-outline}"
PKG=luci-theme-outline
MEDIA=/luci-static/outline
DEPS="luci-base rpcd-mod-ucode ucode-mod-fs ucode-mod-uci uclient-fetch jsonfilter"

VERSION=
ACTIVATE=1
ACTION=install

while [ $# -gt 0 ]; do
	case "$1" in
		--version) VERSION="$2"; shift 2 ;;
		--version=*) VERSION="${1#*=}"; shift ;;
		--no-activate) ACTIVATE=0; shift ;;
		--uninstall) ACTION=uninstall; shift ;;
		--purge) ACTION=purge; shift ;;
		-h|--help) echo "usage: install.sh [--version vX.Y.Z] [--no-activate] [--uninstall | --purge]"; exit 0 ;;
		*) echo "install.sh: unknown option $1" >&2; exit 2 ;;
	esac
done

say() { printf '\033[1m›\033[0m %s\n' "$*"; }
die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run this as root on the router"
[ -f /etc/openwrt_release ] || die "this does not look like OpenWrt"

if [ -x /usr/bin/apk ]; then PM=apk
elif [ -x /bin/opkg ]; then PM=opkg
else die "neither opkg nor apk was found"
fi

TMP="$(mktemp -d /tmp/outline-install.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT INT TERM

fetch() { # url file
	if command -v uclient-fetch >/dev/null 2>&1; then uclient-fetch -q -T 30 -O "$2" "$1" 2>/dev/null
	elif command -v wget >/dev/null 2>&1; then wget -q -O "$2" "$1"
	elif command -v curl >/dev/null 2>&1; then curl -fsSL -o "$2" "$1"
	else return 1
	fi
	[ -s "$2" ]
}

json() { # file expression -- jsonfilter is in every OpenWrt base image
	jsonfilter -i "$1" -e "$2" 2>/dev/null
}

installed() {
	case "$PM" in
		apk) apk info -e "$1" >/dev/null 2>&1 ;;
		*)   [ -f "/usr/lib/opkg/info/$1.control" ] ;;
	esac
}

clear_luci_cache() {
	rm -f /tmp/luci-indexcache* 2>/dev/null || true
	rm -rf /tmp/luci-modulecache 2>/dev/null || true
}

# ── Remove ──

deactivate() {
	local fallback="" name path
	if [ -d /www/luci-static/bootstrap ]; then
		fallback=/luci-static/bootstrap
	else
		for name in $(uci -q show luci.themes | sed -n 's/^luci\.themes\.\([^=]*\)=.*/\1/p'); do
			path="$(uci -q get "luci.themes.$name")"
			[ "$path" != "$MEDIA" ] && [ -d "/www$path" ] && { fallback="$path"; break; }
		done
	fi
	if [ "$(uci -q get luci.main.mediaurlbase)" = "$MEDIA" ] && [ -n "$fallback" ]; then
		uci -q set luci.main.mediaurlbase="$fallback"
	fi
	uci -q delete luci.themes.Outline || true
	uci -q commit luci
}

remove() {
	say "Switching LuCI away from Outline"
	deactivate
	if installed "$PKG"; then
		say "Removing $PKG"
		case "$PM" in
			apk) apk del "$PKG" ;;
			*)   opkg remove "$PKG" ;;
		esac
	fi
	rm -rf /www/luci-static/outline /usr/share/ucode/luci/template/themes/outline \
		/www/luci-static/resources/outline /www/luci-static/resources/view/outline /usr/libexec/outline
	rm -f /www/luci-static/resources/menu-outline.js /www/luci-static/resources/sidebar-outline.js \
		/www/luci-static/resources/router-outline.js \
		/usr/share/rpcd/ucode/luci.outline /usr/share/rpcd/acl.d/luci-theme-outline.json \
		/usr/share/luci/menu.d/luci-theme-outline.json
	if [ "$ACTION" = purge ]; then
		say "Deleting settings and brand images"
		rm -rf /www/luci-static/outline-brand /etc/outline
		rm -f /etc/config/outline
	fi
	clear_luci_cache
	/etc/init.d/rpcd reload >/dev/null 2>&1 || true
	say "Done. LuCI uses $(uci -q get luci.main.mediaurlbase) now."
}

if [ "$ACTION" != install ]; then
	remove
	exit 0
fi

# ── Resolve the release ──
#
# GitHub's API rate-limits shared and CGNAT addresses, so it is not the first
# choice: the release's manifest.json (CDN-served, with checksums), then the
# API, then the public Atom feed plus the release's asset list. The theme's
# Package page uses the same chain (/usr/libexec/outline/job).

TAG='' URLS='' SHA_FILE=''
if [ -n "$VERSION" ]; then
	TAG="$VERSION"
	case "$TAG" in v*) ;; *) TAG="v$TAG" ;; esac
	if fetch "https://github.com/$REPO/releases/download/$TAG/manifest.json" "$TMP/manifest.json"; then
		URLS="$(json "$TMP/manifest.json" '@.files[*].url' || true)"; SHA_FILE="$TMP/manifest.json"
	fi
else
	say "Looking up the latest release of github.com/$REPO"
	if fetch "https://github.com/$REPO/releases/latest/download/manifest.json" "$TMP/manifest.json" &&
	   TAG="$(json "$TMP/manifest.json" '@.tag')" && [ -n "$TAG" ]; then
		URLS="$(json "$TMP/manifest.json" '@.files[*].url')"; SHA_FILE="$TMP/manifest.json"
	elif fetch "https://api.github.com/repos/$REPO/releases/latest" "$TMP/api.json" &&
	     TAG="$(json "$TMP/api.json" '@.tag_name')" && [ -n "$TAG" ]; then
		URLS="$(json "$TMP/api.json" '@.assets[*].browser_download_url')"
	elif fetch "https://github.com/$REPO/releases.atom" "$TMP/releases.atom"; then
		TAG="$(grep -o 'releases/tag/[^"<]*' "$TMP/releases.atom" | head -n1 | sed 's#releases/tag/##')"
	fi
	[ -n "$TAG" ] || die "no release found -- check the router's internet connection"
fi
if [ -z "$URLS" ]; then
	fetch "https://github.com/$REPO/releases/expanded_assets/$TAG" "$TMP/assets.html" ||
		die "release $TAG not found"
	URLS="$(grep -o "/$REPO/releases/download/$TAG/[^\"]*" "$TMP/assets.html" | sed 's#^#https://github.com#' | sort -u)"
fi

case "$PM" in
	apk) URL="$(echo "$URLS" | grep "/$PKG-[0-9][^/]*\.apk\$" | head -n1)" ;;
	*)   URL="$(echo "$URLS" | grep "/${PKG}_[^/]*_all\.ipk\$" | head -n1)" ;;
esac
[ -n "$URL" ] || die "release $TAG has no .$([ "$PM" = apk ] && echo apk || echo ipk) package"
FILE="$TMP/${URL##*/}"

# ── Install ──

missing=
for d in $DEPS; do installed "$d" || missing="$missing $d"; done
if [ -n "$missing" ]; then
	say "Refreshing package lists for:$missing"
	case "$PM" in
		apk) apk update >/dev/null ;;
		*)   opkg update >/dev/null ;;
	esac
fi

say "Downloading ${URL##*/} ($TAG)"
fetch "$URL" "$FILE" || die "download failed: $URL"
if [ -n "$SHA_FILE" ]; then
	want="$(json "$SHA_FILE" "@.files[@.name='${URL##*/}'].sha256" || true)"
	if [ -n "$want" ]; then
		[ "$(sha256sum "$FILE" | cut -d' ' -f1)" = "$want" ] || die "checksum mismatch -- nothing was installed"
		say "Checksum verified"
	fi
fi

say "Installing with $PM"
case "$PM" in
	apk) apk add --allow-untrusted "$FILE" ;;
	*)   opkg install --force-reinstall "$FILE" ;;
esac

if [ "$ACTIVATE" = 1 ]; then
	uci -q batch <<-EOF
		set luci.themes.Outline=$MEDIA
		set luci.main.mediaurlbase=$MEDIA
		commit luci
	EOF
fi
clear_luci_cache
/etc/init.d/rpcd reload >/dev/null 2>&1 || true

ADDR="$(uci -q get network.lan.ipaddr | cut -d/ -f1)"
say "Outline $TAG is installed$([ "$ACTIVATE" = 1 ] && echo " and active")."
say "Open http://${ADDR:-<router>}/cgi-bin/luci -- settings: System › Outline Theme."
