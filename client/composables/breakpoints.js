import { useBreakpoints as bp } from '@vueuse/core';
import { computed } from 'vue';

export default function useBreakpoints() {
    const breakpoints = bp({
        smallMobile: 0,
        mobile: 450,
        tablet: 600,
        laptop: 1000,
        desktop: 1200,
    });

    const active = breakpoints.active();

    return computed(() => ({
        isSmallMobile: active.value === 'smallMobile',
        isMobile: active.value === 'mobile',
        isTablet: active.value === 'tablet',
        isLaptop: active.value === 'laptop',
        isDesktop: active.value === 'desktop',
    }));
};
