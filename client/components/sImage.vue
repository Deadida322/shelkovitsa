<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';

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
            default: true, // Изменяем значение по умолчанию на true
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
    });
    const isServer = typeof window === 'undefined';
    const isLoaded = ref<boolean>(!!isServer);
    const isServerRenderedLoaded = isServer; 

    const imgRef = ref<HTMLImageElement | null>(null);

    const loading = computed<'lazy' | 'eager' | undefined>(() =>
        props.eager ? 'eager' : props.lazy ? 'lazy' : undefined,
    );

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

    function onLoad() {
        isLoaded.value = true;
    }

    function onError() {
        isLoaded.value = true;
    }

    onMounted(() => {
        if (imgRef.value) {
            if (imgRef.value.complete && imgRef.value.naturalWidth > 0) {
                isLoaded.value = true;
            }
            else {
                isLoaded.value = false;
            }
        }
    });
</script>

<template>
    <div class="s-image" :style="wrapperStyle">
        <!-- Gradient overlay -->
        <div
            v-if="gradient"
            class="s-image__gradient"
            :style="{ background: gradient }"
        />

        <!-- Placeholder (blur) - показываем только на клиенте когда изображение ещё не loaded -->
        <img
            v-if="!isLoaded && lazySrc && !isServerRenderedLoaded"
            class="s-image__placeholder"
            :src="lazySrc"
            :alt="alt"
            :style="imageStylePlaceholder"
            decoding="async"
            width="100%"
            height="100%"
        >

        <picture>
            <source
                v-if="webpSrc"
                :srcset="webpSrc"
                type="image/webp"
            >
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
            >
        </picture>

        <!-- central slot -->
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

/* основной img и placeholder — оба абсолютные */
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

/* placeholder сверху, пока основное изображение не загружено */
.s-image__placeholder {
  z-index: 1;
  pointer-events: none;
}

/* основной img ниже placeholder, но выше gradient; его opacity контролируется через inline style */
.s-image__img {
  z-index: 0;
}

/* градиент над картинкой, под контентом */
.s-image__gradient {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

/* слот поверх всех */
.s-image__overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* позволяет элементам быть неинтерактивными по умолчанию */
}

/* разрешаем интерактивность внутри слота */
.s-image__overlay ::v-deep(*) {
  pointer-events: auto;
}
</style>
