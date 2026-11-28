<script setup>
import SImage from '~/components/sImage.vue';
import { formatRub } from '~/utils/money';

const props = defineProps({
    item: {
        type: Object,
        default: () => {},
    },
});

const config = useRuntimeConfig();
const base = config.public.apiBase;
const getLogo =
    props.item.productFiles?.find((item) => item.isLogo)?.name ||
    props.item.productFiles?.[0]?.name;

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
            <SImage
                :src="imageSrc"
                :alt="item.name"
                width="100%"
                aspect-ratio="1"
                :img-width="300"
                :img-height="300"
                sizes="(max-width: 600px) 50vw, 300px"
                cover
            />
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
            <v-chip class="ml-4 shop-item__price" variant="flat" label>
                {{ formatRub(item.price) }}
            </v-chip>
        </template>
    </vs-card>
</template>

<style lang="scss" scoped>
.shop-item__price {
    white-space: nowrap;
    flex-shrink: 0;
}

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
    background-color: #3f0a0e;
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

::v-deep(.vs-card__img .s-image),
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
