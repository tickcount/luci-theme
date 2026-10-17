# Builds luci-theme-outline with the OpenWrt SDK.
#   docker build -f .dev/build/Dockerfile --build-arg SDK_IMAGE=itdoginfo/openwrt-sdk-ipk:24.10.6 .
# The assets in htdocs/ are built by pnpm first and committed; the SDK only
# packs files, so the package is the same on every arch. The context is the
# repository root; .dockerignore lets in only what the package ships.
ARG SDK_IMAGE=itdoginfo/openwrt-sdk-ipk:24.10.6
FROM ${SDK_IMAGE}

# luci.mk names the package after its directory.
COPY Makefile /builder/package/feeds/luci/luci-theme-outline/Makefile
COPY htdocs /builder/package/feeds/luci/luci-theme-outline/htdocs
COPY root /builder/package/feeds/luci/luci-theme-outline/root
COPY ucode /builder/package/feeds/luci/luci-theme-outline/ucode

# The SDK's default config builds every kernel module and every package in the
# feeds; turn that off and select only this package (it ships templates and
# web files, so nothing else needs building).
RUN make defconfig && \
    sed -i -e 's/^CONFIG_ALL_KMODS=y/# CONFIG_ALL_KMODS is not set/' \
           -e 's/^CONFIG_ALL_NONSHARED=y/# CONFIG_ALL_NONSHARED is not set/' \
           -e 's/^CONFIG_ALL=y/# CONFIG_ALL is not set/' .config && \
    echo 'CONFIG_PACKAGE_luci-theme-outline=m' >> .config && \
    make defconfig && \
    make package/luci-theme-outline/compile V=s -j4 && \
    mkdir -p /builder/out && \
    find /builder/bin/packages -name 'luci-theme-outline*' \( -name '*.ipk' -o -name '*.apk' \) -exec cp {} /builder/out/ \;
