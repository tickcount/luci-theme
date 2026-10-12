#
# Copyright (C) 2026 eamonxg <eamonxiong@gmail.com>
# Licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Outline - a ChatGPT-style LuCI theme for OpenWrt.
LUCI_DEPENDS:=+luci-base

PKG_VERSION:=1.0.2
PKG_RELEASE:=20261012
PKG_LICENSE:=Apache-2.0

LUCI_MINIFY_CSS:=
CONFIG_LUCI_CSSTIDY:=

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
