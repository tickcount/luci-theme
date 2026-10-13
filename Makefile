#
# Copyright (C) 2026 eamonxg <eamonxiong@gmail.com>
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Outline - a ChatGPT-style LuCI theme for OpenWrt.
# The System › Outline Theme pages: an rpcd ucode backend (uci, files),
# release lookups (uclient-fetch, jsonfilter).
LUCI_DEPENDS:=+luci-base +rpcd-mod-ucode +ucode-mod-fs +ucode-mod-uci +uclient-fetch +jsonfilter

PKG_VERSION:=1.1.0
PKG_RELEASE:=20261013
PKG_LICENSE:=Apache-2.0

LUCI_MINIFY_CSS:=
CONFIG_LUCI_CSSTIDY:=
# The JS in htdocs/ is already terser output. luci.mk's jsmin predates ES6:
# it squeezes whitespace inside template literals (the settings pages keep
# their CSS in one, ".ot *" would become ".ot*") and eats "//" in them.
LUCI_MINIFY_JS:=0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
