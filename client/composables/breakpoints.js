import { useDisplay } from 'vuetify';

export default function useBreakpoints() {
    const display = useDisplay();

    return {
        isSmallMobile: display.xs, // < 600px
        isMobile: display.sm, // 600–960px
        isTablet: display.md, // 960–1280px
        isLaptop: display.lg, // 1280–1920px
        isDesktop: display.xl, // > 1920px
        active: display.name, // возвращает строку 'xs' | 'sm' | 'md' | 'lg' | 'xl'
        width: display.width, // реактивная ширина экрана
        height: display.height, // реактивная высота экрана
    };
}
