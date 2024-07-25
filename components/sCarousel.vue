<script setup>
    const props = defineProps({
        itemsPerPage: {
            type: Number,
            default: 3
        },
        gap: {
            type: Number,
            default: 10
        }
    })

    const computedGap = computed(()=>`${props.gap}px`);
    const slideWidth = computed(()=> `${ 100 / props.itemsPerPage}%`)
</script>

<template>
    <div class="s-carousel">
        <slot></slot>
    </div>
</template>


<style scoped lang="scss">
    .s-carousel {
        display: flex;
        gap: v-bind("computedGap");
        height: 100%;
        width: 100%;
        overflow-x: auto;
        padding-bottom: 10px;

        ::v-deep(.s-slide) {
            min-width: v-bind("slideWidth");
        }
        &::-webkit-scrollbar {
            height: 6px;               /* ширина scrollbar */
        }
        &::-webkit-scrollbar-track {
            background: transparent;        /* цвет дорожки */
        }
        &::-webkit-scrollbar-thumb {
            background-color: #C4192420;    /* цвет плашки */
            border-radius: 3px;       /* закругления плашки */
            border: none;  /* padding вокруг плашки */
        }
    }
</style>

