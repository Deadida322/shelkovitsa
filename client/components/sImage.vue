<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
    src: {
        type: String,
        required: true,
    },
    webpSrc: {
        type: String,
        default: '',
    },
    lazySrc: {
        type: String,
        default: '',
    },
    alt: {
        type: String,
        default: '',
    },
    height: {
        type: [String, Number],
        default: 'auto',
    },
    width: {
        type: [String, Number],
        default: '100%',
    },
    /** Числовые размеры для Nuxt Image (генерация srcset) */
    imgWidth: {
        type: Number,
        default: undefined,
    },
    imgHeight: {
        type: Number,
        default: undefined,
    },
    aspectRatio: {
        type: [Number, String],
        default: null,
    },
    gradient: {
        type: String,
        default: '',
    },
    cover: {
        type: Boolean,
        default: true,
    },
    lazy: {
        type: Boolean,
        default: true,
    },
    eager: {
        type: Boolean,
        default: false,
    },
    decoding: {
        type: String,
        default: 'async',
    },
    sizes: {
        type: String,
        default: '100vw',
    },
    srcset: {
        type: String,
        default: '',
    },
    /** Nuxt Image (ipx): по умолчанию включён, кроме ручного srcset */
    optimize: {
        type: Boolean,
        default: true,
    },
});

// SSR и первый клиентский кадр: картинка «видима», без opacity/transform рассинхрона
const isLoaded = ref(true);
const hasMounted = ref(false);

const imgRef = ref<HTMLImageElement | { $el?: HTMLImageElement } | null>(null);

const useNuxtImage = computed(() => props.optimize && !props.srcset);

const loading = computed<'lazy' | 'eager' | undefined>(() =>
    props.eager ? 'eager' : props.lazy ? 'lazy' : undefined,
);

const nuxtModifiers = computed(() => ({
    fit: (props.cover ? 'cover' : 'contain') as 'cover' | 'contain',
}));

const wrapperStyle = computed(() => {
    const styles: Record<string, string> = {
        position: 'relative',
        overflow: 'hidden',
        width: typeof props.width === 'number' ? `${props.width}px` : String(props.width),
        height: typeof props.height === 'number' ? `${props.height}px` : String(props.height),
    };

    if (props.aspectRatio && (props.height === 'auto' || props.height === undefined)) {
        styles['aspect-ratio'] = String(props.aspectRatio);
    }

    return styles;
});

const imageStyle = computed(() => ({
    objectFit: props.cover ? 'cover' : 'contain',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: '0',
    left: '0',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    opacity: isLoaded.value ? 1 : 0,
    transform: isLoaded.value ? 'none' : 'scale(1.02)',
}));

const imageStylePlaceholder = computed(() => ({
    objectFit: props.cover ? 'cover' : 'contain',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: '0',
    left: '0',
    filter: 'blur(12px)',
    transform: 'scale(1.04)',
    transition: 'opacity 0.4s ease',
    opacity: isLoaded.value ? 0 : 1,
}));

function resolveImgEl(): HTMLImageElement | null {
    const el = imgRef.value;
    if (!el) {
        return null;
    }
    if (el instanceof HTMLImageElement) {
        return el;
    }
    const root = '$el' in el ? (el as { $el?: unknown }).$el : null;
    if (root instanceof HTMLImageElement) {
        return root;
    }
    if (root instanceof HTMLElement) {
        const nested = root.querySelector('img');
        if (nested instanceof HTMLImageElement) {
            return nested;
        }
    }
    return null;
}

function onLoad() {
    isLoaded.value = true;
}

function onError() {
    isLoaded.value = true;
}

function syncImageLoadState() {
    const img = resolveImgEl();
    if (!img) {
        return;
    }
    if (!img.complete || img.naturalWidth === 0) {
        isLoaded.value = false;
        return;
    }
    isLoaded.value = true;
}

onMounted(async () => {
    hasMounted.value = true;
    await nextTick();
    syncImageLoadState();
});

watch(
    () => props.src,
    async () => {
        isLoaded.value = true;
        await nextTick();
        syncImageLoadState();
    },
);
</script>

<template>
    <div class="s-image" :style="wrapperStyle">
        <div v-if="gradient" class="s-image__gradient" :style="{ background: gradient }" />

        <img
            v-if="!isLoaded && lazySrc && hasMounted"
            class="s-image__placeholder"
            :src="lazySrc"
            :alt="alt"
            :style="imageStylePlaceholder"
            decoding="async"
            width="100%"
            height="100%"
        />

        <NuxtImg
            v-if="useNuxtImage"
            ref="imgRef"
            class="s-image__img"
            :src="src"
            :alt="alt"
            :width="imgWidth"
            :height="imgHeight"
            :sizes="sizes"
            :loading="loading"
            :modifiers="nuxtModifiers"
            :placeholder="false"
            :style="imageStyle"
            @load="onLoad"
            @error="onError"
        />

        <picture v-else>
            <source v-if="webpSrc" :srcset="webpSrc" type="image/webp" />
            <img
                ref="imgRef"
                class="s-image__img"
                :src="src"
                :srcset="srcset"
                :sizes="sizes"
                :alt="alt"
                :loading="loading"
                :decoding="decoding"
                :style="imageStyle"
                width="100%"
                height="100%"
                @load="onLoad"
                @error="onError"
            />
        </picture>

        <div class="s-image__overlay">
            <slot />
        </div>
    </div>
</template>

<style scoped>
.s-image {
    display: block;
    position: relative;
    background-color: #eee;
    border-radius: 12px;
}

.s-image__img,
.s-image__placeholder {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    will-change: opacity, transform;
}

.s-image__placeholder {
    z-index: 1;
    pointer-events: none;
}

.s-image__img {
    z-index: 0;
}

.s-image__gradient {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
}

.s-image__overlay {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.s-image__overlay ::v-deep(*) {
    pointer-events: auto;
}
</style>
