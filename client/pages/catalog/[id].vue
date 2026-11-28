<script setup>
import { useCartStore } from '@/stores/cart';
import { computed, watch } from 'vue';
import { VsNotification } from 'vuesax-alpha';
import { useDisplay } from 'vuetify/lib/framework.mjs';
import SValidation from '~/components/sValidation.vue';
import { formatRub, kopecksToRublesInput } from '~/utils/money';

const route = useRoute();
const config = useRuntimeConfig();
const base = config.public.apiBase;
const cartStore = useCartStore();
const filtersStore = useFiltersStore();

const { $api } = useNuxtApp();

const cartInfo = ref({
    amount: 1,
});

const payload = ref({});
const displayedImage = ref(``);
const showImageViewer = ref(false);
const imageViewerIndex = ref(0);
const { mobile } = useDisplay();

const {
    data: shopItem,
    pending: loading,
    error: loadError,
} = await useAsyncData(
    `shopItem-${route.params.id}`,
    async () => {
        return await $api(`/api/product-article/${route.params.id}`);
    },
    {
        default: () => null,
    },
);

/** Только 404 / скрыт / архив — полноэкранная заглушка. Нулевой остаток карточку не прячет. */
const isUnavailable = computed(() => Boolean(loadError.value || !shopItem.value?.id));

/** Остаток выбранного SKU (только после /api/product с размером и цветом). */
const variantStock = ref(null);

const hasVariantSelection = computed(() => Boolean(cartInfo.value.size && cartInfo.value.color));

const showStockCaption = computed(
    () =>
        hasVariantSelection.value &&
        typeof variantStock.value === 'number' &&
        variantStock.value > 0,
);

const countInputMax = computed(() => {
    if (!hasVariantSelection.value || typeof variantStock.value !== 'number') {
        return 1;
    }
    return Math.max(1, variantStock.value);
});

/** Нет в наличии — только для выбранного варианта, не по сумме артикула. */
const isOutOfStock = computed(() => {
    if (isUnavailable.value || !hasVariantSelection.value) return false;
    if (variantStock.value === null) return false;
    return variantStock.value <= 0;
});

const canAddToCart = computed(
    () =>
        !isUnavailable.value &&
        !isOutOfStock.value &&
        hasVariantSelection.value &&
        typeof variantStock.value === 'number' &&
        variantStock.value > 0,
);

const logo = computed(() => {
    const logoName =
        shopItem.value?.productFiles?.find((item) => item.isLogo)?.name ||
        shopItem.value?.productFiles?.[0]?.name;
    return logoName ? `${base}/static/${logoName}` : '';
});

watch(
    logo,
    (src) => {
        if (src) {
            displayedImage.value = src;
        }
    },
    { immediate: true },
);

function addToCart() {
    if (!shopItem.value?.id || !canAddToCart.value) return;
    const item = {
        id: route.params.id,
        productId: cartInfo.value.productId,
        productSizeId: cartInfo.value.size,
        productColorId: cartInfo.value.color,
        name: shopItem.value.name,
        price: shopItem.value.price,
        amount: cartInfo.value.amount,
        maxAmount: variantStock.value ?? 1,
        logo: (
            shopItem.value.productFiles?.find((item) => item.isLogo) ??
            shopItem.value.productFiles?.[0]
        )?.name,
    };
    cartStore.updateCart(item);
    VsNotification({
        title: 'Добавлено!',
        content: `Отличный выбор! Товар добавлен в корзину`,
        position: 'bottom-center',
    });
}

const productImages = computed(() => {
    return shopItem.value?.productFiles?.map((file) => `${base}/static/${file.name}`) || [];
});

function goToCatalog() {
    navigateTo({ path: '/catalog', query: filtersStore.toQuery() });
}

// Функция для обновления SEO информации
function updateSEO() {
    if (isUnavailable.value) {
        useHead({
            title: 'Товар недоступен - Шелковица',
            meta: [
                {
                    name: 'description',
                    content:
                        'Товар снят с витрины или не найден. Посмотрите другие позиции в каталоге.',
                },
                { name: 'robots', content: 'noindex, nofollow' },
            ],
        });
        return;
    }
    if (!shopItem.value?.name) return;

    useHead({
        title: `${shopItem.value.name} - Шелковица`,
        meta: [
            {
                name: 'description',
                content:
                    shopItem.value.description ||
                    `Купить ${shopItem.value.name} в интернет-магазине "Шелковица". Высокое качество, демократичные цены, доставка по всей России.`,
            },
            {
                name: 'keywords',
                content: `${shopItem.value.name}, купить, нижнее белье, женское белье, белье, ${shopItem.value.productCategories?.map((c) => c.name).join(', ') || ''}`,
            },
            { property: 'og:title', content: `${shopItem.value.name} - Шелковица` },
            {
                property: 'og:description',
                content:
                    shopItem.value.description ||
                    `Купить ${shopItem.value.name} в интернет-магазине "Шелковица". Высокое качество, демократичные цены, доставка по всей России.`,
            },
            { property: 'og:type', content: 'product' },
            { property: 'og:url', content: `https://shelkovitsa.ru/catalog/${route.params.id}` },
            { property: 'og:image', content: logo.value || '/main.webp' },
            { name: 'twitter:card', content: 'summary_large_image' },
            {
                name: 'product:price:amount',
                content:
                    shopItem.value.price != null ? kopecksToRublesInput(shopItem.value.price) : '0',
            },
            { name: 'product:price:currency', content: 'RUB' },
        ],
        link: [{ rel: 'canonical', href: `https://shelkovitsa.ru/catalog/${route.params.id}` }],
    });
}
watch(
    () => cartInfo.value.size,
    (val) => {
        payload.value = {
            ...payload.value,
            productSizeId: val,
        };

        delete cartInfo.value.color;
        variantStock.value = null;
        delete cartInfo.value.productId;
    },
);

watch(
    () => cartInfo.value.color,
    (val) => {
        payload.value = {
            ...payload.value,
            productColorId: val,
        };
    },
);

watch(shopItem, () => {
    updateSEO();
});

watch(
    () => route.params.id,
    () => {
        updateSEO();
    },
    { immediate: true },
);

watch(
    cartInfo,
    async () => {
        if (isUnavailable.value || !shopItem.value?.id) return;
        await nextTick();
        if (cartInfo.value.color && cartInfo.value.size) {
            try {
                const { amount, id } = await $api('/api/product', {
                    query: {
                        ...payload.value,
                        productArticleId: +route.params.id,
                    },
                });
                cartInfo.value.productId = id;
                variantStock.value = typeof amount === 'number' ? amount : 0;
            } catch {
                variantStock.value = 0;
            }
        } else {
            variantStock.value = null;
            delete cartInfo.value.productId;
            try {
                const res = await $api(`/api/product-article/${route.params.id}`, {
                    query: payload.value,
                });
                shopItem.value = res;
                displayedImage.value = logo.value;
                updateSEO();
            } catch {
                // карточка уже могла стать недоступной — оставляем текущее состояние
            }
        }
    },
    { immediate: true, deep: true },
);

function handleImageClick(image, index) {
    displayedImage.value = image;
    if (!showImageViewer.value) {
        imageViewerIndex.value = index;
        showImageViewer.value = true;
    }
}

function handleImageError(event) {
    console.error('Ошибка загрузки изображения:', event.target.src);
}

const shopColorImage = computed(() => {
    if (!cartInfo.value.color || !shopItem.value?.productColors) return null;
    const color = shopItem.value.productColors.find(({ id }) => id === cartInfo.value.color);
    if (!color) return null;
    if (color.image) return `${base}/static/${color?.image}`;
    if (color.url) return color.url;
    return null;
});
</script>

<template>
    <div>
        <div v-if="loading" class="catalog-item-page catalog-item-page--status text-center pa-8">
            Загрузка…
        </div>

        <div v-else-if="isUnavailable" class="catalog-item-page catalog-item-page--status">
            <vs-alert color="#1A5CFF">
                <template #icon>
                    <v-icon size="40">mdi-information</v-icon>
                </template>
                <div class="text-h6 mb-2">Товар недоступен</div>
                <div>Товар снят с витрины или не найден. Посмотрите другие позиции в каталоге.</div>
                <a href="#" class="catalog-item-page__catalog-link" @click.prevent="goToCatalog">
                    Перейти в каталог
                </a>
            </vs-alert>
        </div>

        <div v-else class="catalog-item-page catalog-item">
            <vs-alert v-if="isOutOfStock" class="mb-4" color="#1A5CFF">
                <template #icon>
                    <v-icon size="40">mdi-information</v-icon>
                </template>
                <div class="text-h6 mb-2">Товар закончился</div>
                <div>
                    Этот товар временно отсутствует на складе. Посмотрите другие позиции в каталоге.
                </div>
                <a href="#" class="catalog-item-page__catalog-link" @click.prevent="goToCatalog">
                    Перейти в каталог
                </a>
            </vs-alert>
            <h1 class="text-h6">
                {{ shopItem.name }}
            </h1>
            <SImageViewer
                v-model="showImageViewer"
                :images="productImages"
                :initial-index="imageViewerIndex"
            />
            <div class="catalog-item__container">
                <div class="catalog-item__images mt-4">
                    <SImage
                        cover
                        class="image-main"
                        :height="mobile ? '400px' : '300px'"
                        :img-width="800"
                        :img-height="800"
                        sizes="800px"
                        eager
                        :src="displayedImage"
                        @click="showImageViewer = true"
                        @error="handleImageError"
                    />
                    <s-carousel class="images-carousel mt-4" :items-per-page="1.8">
                        <s-slide v-for="(file, index) in shopItem.productFiles" :key="file.id">
                            <SImage
                                cover
                                class="carousel-image"
                                height="200px"
                                :img-width="320"
                                :img-height="200"
                                sizes="200px"
                                :src="`${base}/static/${file.name}`"
                                @click="handleImageClick(`${base}/static/${file.name}`, index)"
                                @error="handleImageError"
                            />
                        </s-slide>
                    </s-carousel>
                </div>
                <SValidation
                    v-slot="{ submit }"
                    class="catalog-item__info mt-2"
                    @submit="addToCart"
                >
                    <h3 class="text-h6">Описание товара</h3>
                    <div class="item-info__description text-body1">
                        {{ shopItem.description }}
                    </div>
                    <h3 class="text-h6 mt-4">Размеры в сетке Российских размеров</h3>
                    <div class="item-info__description text-body1 mt-4">
                        {{ shopItem.sizes?.join(', ') }}
                    </div>
                    <div class="item-info__to-cart mt-4 d-flex flex-column align-end">
                        <div class="item-info__select-container">
                            <div class="item-info__select">
                                <s-select
                                    v-model="cartInfo.size"
                                    required
                                    label="Размер"
                                    class="item-info__select"
                                    placeholder="Укажите размер"
                                    :options="shopItem.productSizes"
                                    label-key="name"
                                />
                            </div>
                            <div class="item-info__select color-container">
                                <s-select
                                    v-model="cartInfo.color"
                                    :disabled="!cartInfo.size"
                                    required
                                    class="item-info__select"
                                    placeholder="Укажите цвет"
                                    label="Цвет"
                                    label-key="name"
                                    :options="shopItem.productColors"
                                />
                                <div v-if="shopColorImage" class="color-square">
                                    <img :src="shopColorImage" alt="цвет отображения" />
                                </div>
                            </div>
                        </div>
                        <s-count-input
                            v-model="cartInfo.amount"
                            :max="countInputMax"
                            class="mt-4"
                            label="Количество"
                        />
                        <div v-if="showStockCaption" class="item-info__count-caption">
                            На складе
                            <span>{{ variantStock }}</span>
                            шт.
                        </div>
                        <div class="item-info__actions d-flex mt-4">
                            <vs-button class="item-info__price" disabled type="flat">
                                {{ formatRub(shopItem.price) }}
                            </vs-button>
                            <vs-button :disabled="isOutOfStock" @click="submit">
                                {{ isOutOfStock ? 'Нет в наличии' : 'Добавить в корзину' }}
                                <v-icon v-if="!isOutOfStock" class="ml-1">mdi-cart-outline</v-icon>
                            </vs-button>
                        </div>
                    </div>
                </SValidation>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.catalog-item-page {
    &--status {
        max-width: 640px;
        margin: 24px auto;
    }

    &__catalog-link {
        display: inline-block;
        margin-top: 12px;
        color: inherit;
        text-decoration: underline;
    }
}

.catalog-item {
    &__container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;

        @media screen and (max-width: 768px) {
            grid-template-columns: auto;
            grid-template-rows: repeat(2, 1fr);
        }
    }
}

.color-container {
    display: flex;
    gap: 8px;
}
.color-square {
    border: 1px solid black;
    border-radius: 4px;
    width: 42px;
    height: 42px;
    align-self: flex-end;
    overflow: hidden;

    img {
        object-fit: cover;
        height: 100%;
        width: 100%;
    }
}

.item-info {
    &__select-container {
        gap: 10px;
        display: flex;
        flex-direction: column;
        @media screen and (max-width: 768px) {
            width: 100%;
            ::v-deep(.vs-select) {
                max-width: 100%;
            }
        }
    }

    &__price {
        white-space: nowrap;
        flex-shrink: 0;
    }

    &__actions {
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
    }
}
</style>
