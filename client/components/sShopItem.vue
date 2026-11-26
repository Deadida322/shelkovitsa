<script setup>
    const props = defineProps({
        item: {
            type: Object,
            default: () => {},
        },
    });

    const config = useRuntimeConfig();
    const base = config.public.apiBase;
    const getLogo = props.item.productFiles?.find(item => item.isLogo)?.name || props.item.productFiles?.[0]?.name;

    // Формируем пути к изображениям с учетом оптимизации
    const imageSrc = `${base}/static/${getLogo}`;
</script>

<template>
    <vs-card>
        <template #title>
            <h3 class="item-title">
                {{ item.name }}
            </h3>
        </template>
        <template #img>
            <img
                :src="imageSrc"
                :alt="item.name"
                loading="lazy"
                decoding="async"
                width="300"
                height="300"
                style="object-fit: cover;"
            >
        </template>
        <template #text>
            <p class="item-description">
                {{ item.description }}
            </p>
        </template>
        <template #interactions>
            <vs-button color="danger" icon>
                <v-icon>mdi-cart</v-icon>
            </vs-button>
            <v-chip
                class="ml-4"
                variant="flat"
                label
            >
                {{ item.price }} ₽
            </v-chip>
        </template>
    </vs-card>
</template>

<style lang="scss" scoped>
    .item-title {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
        min-height: calc(1.3em * 2);
    }

    .item-description {
        line-height: 16px;
        min-height: 48px;
        max-height: 48px;
        text-overflow: ellipsis;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
    }

    ::v-deep(.vs-card-content) {
        display: flex;
        width: 100%;
        max-width: 100%;
        height: 100% !important;
    }

    ::v-deep(.vs-card) {
        background-color: #3F0A0E;
        flex-direction: column;
        display: flex;
        flex: 1;
        height: 100%;
        width: 100%;
        max-width: 100%;
    }

    ::v-deep(.vs-card__img) {
        flex: none;
        width: 100%;
        aspect-ratio: 1 / 1;
        max-height: none;
    }

    ::v-deep(.vs-card__img img) {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
    }

    ::v-deep(.vs-card__text) {
        color: white;
        flex-shrink: 0;
    }

    ::v-deep(.vs-card__title) {
        min-height: calc(1.3em * 2 + 15px);
    }
</style>
