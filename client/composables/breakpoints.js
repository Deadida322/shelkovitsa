// eslint-disable-next-line unicorn/prefer-node-protocol
import process from 'process';
import { useBreakpoints as bp } from '@vueuse/core';

export default function useBreakpoints() {
    const breakpoints = bp(
        {
            smallMobile: 0,
            mobile: 450,
            tablet: 600,
            laptop: 1000,
            desktop: 1200,
        },
        {
            ssrWidth: process.server ? 1024 : undefined,
        },
    );

    return {
        isSmallMobile: breakpoints.smaller('mobile'),
        isMobile: breakpoints.between('mobile', 'tablet'),
        isTablet: breakpoints.between('tablet', 'laptop'),
        isLaptop: breakpoints.between('laptop', 'desktop'),
        isDesktop: breakpoints.greater('laptop'),
        active: breakpoints.active(),
    };
}
