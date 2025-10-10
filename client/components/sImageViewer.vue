<script setup>
    const props = defineProps({
        images: {
            type: Array,
            default: () => [],
        },
        modelValue: {
            type: Boolean,
            default: false,
        },
        initialIndex: {
            type: Number,
            default: 0,
        },
    });

    const emit = defineEmits(['update:modelValue']);

    const currentIndex = ref(props.initialIndex);

    watch(() => props.modelValue, (newValue) => {
        if (newValue) {
            currentIndex.value = props.initialIndex;
        }
    });

    function closeViewer() {
        emit('update:modelValue', false);
    }

    function goToPrevious() {
        if (currentIndex.value > 0) {
            currentIndex.value--;
        }
        else {
            currentIndex.value = props.images.length - 1;
        }
    }

    function goToNext() {
        if (currentIndex.value < props.images.length - 1) {
            currentIndex.value++;
        }
        else {
            currentIndex.value = 0;
        }
    }

    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            closeViewer();
        }
        else if (event.key === 'ArrowLeft') {
            goToPrevious();
        }
        else if (event.key === 'ArrowRight') {
            goToNext();
        }
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });
</script>

<template>
    <div
        v-if="modelValue && images.length"
        class="s-image-viewer"
        @click="closeViewer"
    >
        <div class="s-image-viewer__container" @click.stop>
            <v-btn
                v-if="images.length > 1"
                class=" s-image-viewer__nav--prev"
                icon="mdi-chevron-left"
                variant="tonal"
                color="white"
                @click="goToPrevious"
            />

            <div class="s-image-viewer__image-container">
                <v-btn
                    class="s-image-viewer__close"
                    icon="mdi-close"
                    variant="plain"
                    color="white"
                    border="2"
                    @click="closeViewer"
                />
                <img
                    :src="images[currentIndex]"
                    class="s-image-viewer__image"
                    alt="Product image"
                >
            </div>

            <v-btn
                v-if="images.length > 1"
                class="s-image-viewer__nav--next"
                variant="tonal"
                color="white"
                icon="mdi-chevron-right"
                @click="goToNext"
            />

            <div v-if="images.length > 1" class="s-image-viewer__indicators">
                <span
                    v-for="(image, index) in images"
                    :key="index"
                    class="s-image-viewer__indicator"
                    :class="{
                        's-image-viewer__indicator--active': index === currentIndex,
                    }"
                    @click="currentIndex = index"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.s-image-viewer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;

    &__container {
        position: relative;
        width: 90%;
        height: 90%;
        max-width: 1200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__close {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10001;
    }

    &__nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s;

        &:hover {
            background-color: rgba(255, 255, 255, 0.3);
        }

        &--prev {
            left: 20px;
        }

        &--next {
            right: 20px;
        }
    }

    &__image-container {
        flex: 1;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }

    &__image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
    }

    &__indicators {
        position: absolute;
        bottom: 20px;
        display: flex;
        gap: 10px;
    }

    &__indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: background-color 0.3s;

        &--active {
            background-color: white;
        }
    }
}

@media (max-width: 768px) {
    .s-image-viewer {
        &__container {
            width: 95%;
            height: 80%;
        }

        &__nav {
            width: 40px;
            height: 40px;
            font-size: 20px;
        }

        &__image-container {
            padding: 10px;
        }
    }
}
</style>
