#
# Copyright (C) 2026 eamonxg <eamonxiong@gmail.com>
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Outline - a ChatGPT-style LuCI theme for OpenWrt.
# The System › Outline Theme pages: an rpcd ucode backend (uci, files),
# release lookups (uclient-fetch, jsonfilter). Runtime dependencies only
# (control file Depends): the package ships templates and web files, so the
# SDK has nothing to build for them. OpenWrt 25.12's luci.mk wants a version
# on each; (>=0) means any.
LUCI_EXTRA_DEPENDS:=luci-base (>=0), rpcd-mod-ucode (>=0), ucode-mod-fs (>=0), ucode-mod-uci (>=0), \
	uclient-fetch (>=0), jsonfilter (>=0)
LUCI_PKGARCH:=all

PKG_VERSION:=1.2.0
PKG_RELEASE:=20261017
PKG_LICENSE:=Apache-2.0

LUCI_MINIFY_CSS:=
CONFIG_LUCI_CSSTIDY:=
# The JS in htdocs/ is already terser output. luci.mk's jsmin predates ES6:
# it squeezes whitespace inside template literals (the settings pages keep
# their CSS in one, ".ot *" would become ".ot*") and eats "//" in them.
LUCI_MINIFY_JS:=0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
