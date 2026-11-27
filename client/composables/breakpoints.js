import { computed, reactive } from 'vue';
import { useDisplay } from 'vuetify';

export default function useBreakpoints() {
    const display = useDisplay();

    return reactive({
        isSmallMobile: computed(() => display.xs.value), // < 600px
        isMobile: computed(() => display.sm.value), // 600–960px
        isTablet: computed(() => display.md.value), // 960–1280px
        isLaptop: computed(() => display.lg.value), // 1280–1920px
        isDesktop: computed(() => display.xl.value), // > 1920px
        active: computed(() => display.name.value), // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
        width: display.width, // реактивная ширина экрана
        height: display.height, // реактивная высота экрана
    });
}
