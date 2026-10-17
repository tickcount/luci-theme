#!/bin/sh
# shellcheck shell=dash
#
# Release notes for a tag, from the commits since the previous tag:
#   .dev/scripts/release-notes.sh v1.1.1 [repository]
#   PREV_TAG=v1.0.3 .dev/scripts/release-notes.sh v1.1.0   (compare with another tag)
#
# Release commits ("Outline 1.1.1") list their changes as "- " lines in the
# body: those become the points. Other commits add their title; merges are
# skipped. Wrapped points are joined into one line.
set -eu

TAG="${1:?usage: release-notes.sh <tag> [owner/repo]}"
REPO="${2:-tickcount/luci-theme-outline}"

git rev-parse -q --verify "$TAG^{commit}" >/dev/null || {
	echo "release-notes: no tag $TAG" >&2
	exit 1
}
# The previous release: the nearest older tag, or PREV_TAG when a tag was never published.
PREV="${PREV_TAG:-$(git describe --tags --abbrev=0 --match 'v[0-9]*' "$TAG^" 2>/dev/null || true)}"
if [ -n "$PREV" ] && ! git rev-parse -q --verify "$PREV^{commit}" >/dev/null; then
	echo "release-notes: no tag $PREV" >&2
	exit 1
fi
RANGE="$TAG"
[ -n "$PREV" ] && RANGE="$PREV..$TAG"
# git log runs alone first: a failure must stop the script, not vanish into the pipe.
git log --no-merges --format='%s' "$RANGE" >/dev/null

# One record per commit, newest first: the subject, then the body; records end with RS (\036).
points="$(git log --no-merges --format='%s%n%b%x1e' "$RANGE" | awk '
	BEGIN { RS = "\036" }
	{
		n = split($0, line, "\n")
		title = ""
		for (i = 1; i <= n; i++) if (line[i] != "") { title = line[i]; start = i + 1; break }
		if (title == "") next
		got = 0; cur = ""
		for (i = start; i <= n; i++) {
			if (line[i] ~ /^[ \t]*[-*][ \t]+/) {
				if (cur != "") { print "- " cur; got = 1 }
				cur = line[i]; sub(/^[ \t]*[-*][ \t]+/, "", cur)
			} else if (cur != "" && line[i] ~ /^[ \t]+[^ \t]/) {
				l = line[i]; sub(/^[ \t]+/, "", l); cur = cur " " l
			} else if (cur != "") { print "- " cur; got = 1; cur = "" }
		}
		if (cur != "") { print "- " cur; got = 1 }
		# A release commit without a list says nothing new; any other commit is its title.
		if (!got && title !~ /^(Outline )?v?[0-9]+\.[0-9]+(\.[0-9]+)?$/) print "- " title
	}')"

if [ -n "$points" ]; then
	printf "## What’s new\n\n%s\n\n" "$points"
fi
cat <<EOF
## Install

Install or upgrade on the router (OpenWrt 24.10 with opkg, or 25.12 with apk):

\`\`\`sh
wget -qO- https://raw.githubusercontent.com/$REPO/master/install.sh | sh
\`\`\`

Or update from LuCI → System › Outline Theme › Package.
EOF
if [ -n "$PREV" ]; then
	printf '\n**Full Changelog**: https://github.com/%s/compare/%s...%s\n' "$REPO" "$PREV" "$TAG"
else
	printf '\n**Full Changelog**: https://github.com/%s/commits/%s\n' "$REPO" "$TAG"
fi
