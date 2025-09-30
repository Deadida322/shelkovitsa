<script setup>
import { useCartStore } from '@/stores/cart';
import { notification } from 'vuesax-alpha/lib/components/notification/src/notify.js';

const route = useRoute();
const shopItem = ref({});
const config = useRuntimeConfig();
const base = config.public.apiBase;
const cartStore = useCartStore();

const { $api } = useNuxtApp();

const cartInfo = ref({
    amount: 1,
});

const payload = ref({});
const displayedImage = ref(``);
const showImageViewer = ref(false);
const imageViewerIndex = ref(0);
const loading = ref(true);

function addToCart() {
    const item = {
        productId: cartInfo.value.productId,
        productSizeId: cartInfo.value.size,
        productColorId: cartInfo.value.color,
        name: shopItem.value.name,
        price: shopItem.value.price,
        amount: cartInfo.value.amount,
        maxAmount: shopItem.value.available,
        logo: shopItem.value.productFiles.find(item => item.isLogo).name,
    };
    cartStore.updateCart(item);
    notification({
        title: 'Добавлено!',
        content: `Отличный выбор! Товар добавлен в корзину`,
        position: 'bottom-center',
    });
};

const logo = computed(() => {
    const logo = shopItem.value.productFiles?.find(item => item.isLogo)?.name || shopItem.value.productFiles?.[0]?.name;
    return logo ? `${base}/${logo}` : '';
});

const productImages = computed(() => {
    return shopItem.value.productFiles?.map(file => `${base}/${file.name}`) || [];
});

// Функция для обновления SEO информации
function updateSEO() {
    if (!shopItem.value || !shopItem.value.name)
        return;

    useHead({
        title: `${shopItem.value.name} - Шелковица`,
        meta: [
            {
                name: 'description',
                content: shopItem.value.description || `Купить ${shopItem.value.name} в интернет-магазине "Шелковица". Высокое качество, демократичные цены, доставка по всей России.`,
            },
            {
                name: 'keywords',
                content: `${shopItem.value.name}, купить, нижнее белье, женское белье, белье, ${shopItem.value.productCategories?.map(c => c.name).join(', ') || ''}`,
            },
            { property: 'og:title', content: `${shopItem.value.name} - Шелковица` },
            { property: 'og:description', content: shopItem.value.description || `Купить ${shopItem.value.name} в интернет-магазине "Шелковица". Высокое качество, демократичные цены, доставка по всей России.` },
            { property: 'og:type', content: 'product' },
            { property: 'og:url', content: `https://shelkovitsa.ru/catalog/${route.params.id}` },
            { property: 'og:image', content: logo.value || '/main.webp' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'product:price:amount', content: shopItem.value.price?.toString() || '0' },
            { name: 'product:price:currency', content: 'RUB' },
        ],
        link: [
            { rel: 'canonical', href: `https://shelkovitsa.ru/catalog/${route.params.id}` },
        ],
    });
}

watch(() => cartInfo.value.size, (val) => {
    payload.value = {
        ...payload.value,
        productSizeId: val,
    };

    delete cartInfo.value.color;
});

watch(() => cartInfo.value.color, (val) => {
    payload.value = {
        ...payload.value,
        productColorId: val,
    };
});

// Отслеживаем изменения параметров маршрута для обновления SEO
watch(() => route.params.id, () => {
    updateSEO();
}, { immediate: true });

// Отслеживаем изменения товара для обновления SEO
watch(shopItem, () => {
    updateSEO();
});

watch(cartInfo, async () => {
    await nextTick();
    if (cartInfo.value.color && cartInfo.value.size) {
        $api(`/api/product/get`, {
            method: 'POST',
            body: {
                ...payload.value,
                productArticleId: +route.params.id,
            },
        }).then(({ amount, id }) => {
            cartInfo.value.productId = id;
            shopItem.value.available = amount;
        });
    }
    else {
        $api(`/api/product-article/${route.params.id}`, { method: 'POST', body: payload.value }).then((res) => {
            shopItem.value = res;
            displayedImage.value = logo.value;
            loading.value = false;
            // Обновляем SEO при загрузке товара
            updateSEO();
        });
    }
}, { immediate: true, deep: true });

function handleImageClick(image, index) {
    displayedImage.value = image;
    if (!showImageViewer.value) {
        imageViewerIndex.value = index;
        showImageViewer.value = true;
    }
};
</script>

<template>
    <div>
        <s-shop-item-detail-skeleton v-if="loading" />
        <div v-else class="catalog-item-page catalog-item">
            <h1 class="text-h6">
                {{ shopItem.name }}
            </h1>
            <SImageViewer
                v-model="showImageViewer"
                :images="productImages"
                :initial-index="imageViewerIndex"
            />
            <div class="catalog-item__container d-flex">
                <div class="catalog-item__images mt-4">
                    <v-img
                        cover
                        class="image-main"
                        height="200px"
                        :src="displayedImage"
                        @click="showImageViewer = true"
                    />
                    <s-carousel
                        class="images-carousel mt-4"
                        :items-per-page="1.8"
                    >
                        <s-slide
                            v-for="({ name }, key) in shopItem.productFiles"
                            :key="key"
                        >
                            <v-img
                                cover
                                class="carousel-image"
                                height="100px"
                                :src="`${base}/${name}`"
                                @click="handleImageClick(`${base}/${name}`, key)"
                            />
                        </s-slide>
                    </s-carousel>
                </div>
                <s-validate v-slot="{ submit }" class="catalog-item__info mt-2" @submit="addToCart">
                    <h3 class="text-h6">
                        Описание товара
                    </h3>
                    <div class="item-info__description text-body1">
                        {{ shopItem.description }}
                    </div>
                    <h3 class="text-h6 mt-4">
                        Размеры в сетке Российских размеров
                    </h3>
                    <div class="item-info__description text-body1  mt-4">
                        {{ shopItem.sizes?.join(", ") }}
                    </div>
                    <div class="item-info__to-cart mt-4 d-flex flex-column align-end">
                        <div class="item-info__select-container">
                            <client-only>
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
                                <div class="item-info__select">
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
                                </div>
                            </client-only>
                        </div>
                        <s-count-input
                            v-model="cartInfo.amount"
                            :max="shopItem.available || 1"
                            class="mt-4"
                            label="Количество"
                        />
                        <div v-if="shopItem.available" class="item-info__count-caption">
                            На складе <span>{{ shopItem.available }}</span> шт.
                        </div>
                        <div class="item-info__actions d-flex mt-4">
                            <vs-button
                                disabled
                                type="flat"
                            >
                                {{ shopItem.price }} ₽
                            </vs-button>
                            <vs-button @click="submit">
                                Добавить в корзину  <v-icon class="ml-1">
                                    mdi-cart-outline
                                </v-icon>
                            </vs-button>
                        </div>
                    </div>
                </s-validate>
            </div>
        </div>
    </div>
</template>
