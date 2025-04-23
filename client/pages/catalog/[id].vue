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
const showImage = ref(false);

function addToCart() {
    const item = {
        productId: cartInfo.value.productId,
        productSizeId: cartInfo.value.size,
        productColorId: cartInfo.value.color,
        name: shopItem.value.name,
        price: shopItem.value.price,
        amount: cartInfo.value.amount,
        maxAmount: shopItem.value.available,
        logo: shopItem.value.productFiles.find(item => item.isLogo).image,
    };
    cartStore.updateCart(item);
    notification({
        title: 'Добавлено!',
        content: `Отличный выбор! Товар добавлен в корзину`,
        position: 'bottom-center',
    });
};

const logo = computed(() => {
    const logo = shopItem.value.productFiles.find(item => item.isLogo)?.image || shopItem.value.productFiles[0];
    return `${base}/${logo}`;
});

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
        });
    }
}, { immediate: true, deep: true });
</script>

<template>
    <div class="catalog-item-page catalog-item">
        <div
            v-if="showImage"
            class="image-preview"
            @click="showImage = false"
        >
            <v-img
                :src="displayedImage"
                width="90%"
                height="90%"
            />
        </div>
        <h1 class="text-h6">
            {{ shopItem.name }}
        </h1>
        <div class="catalog-item__container d-flex">
            <div class="catalog-item__images mt-4">
                <v-img
                    cover
                    class="image-main"
                    height="200px"
                    :src="displayedImage"
                    @click="showImage = true"
                />
                <s-carousel
                    class="images-carousel mt-4"
                    :items-per-page="1.8"
                >
                    <s-slide
                        v-for="({ image }, key) in shopItem.productFiles"
                        :key="key"
                    >
                        <v-img
                            cover
                            class="carousel-image"
                            height="100px"
                            :src="`${base}/${image}`"
                            @click="displayedImage = `${base}/${image}`"
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
</template>

<style lang="scss">
    .vs-pager__aria-active {
        z-index: 1 !important;
    }

    .catalog-item {
        &__container {
            width: 100%;
            justify-content: space-between;
        }
        &__images {
            width: 40%;

        }
        &__info {
            width: 58%;
        }
    }

    .item-info {
        &__select {
            width: 50% !important;
            .vs-select {
                max-width: 100%;
            }
        }
        &__select-container {
            display: flex;
            gap: 20px;
            width: 100%;
        }

        &__count-caption {
            font-size: 12px;
            opacity: .8;
            margin-top: 10px;
            span {
                color: $primary
            }
        }

    }

    .carousel-image {
        border-radius: 12px;
        cursor: pointer;
    }

    .images-carousel {
        height: 100px !important;
    }

    .image-main {
        border-radius: 12px;
        cursor: pointer;
    }

    .image-preview {
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.168);
        display: flex;
        position: fixed;
        z-index: 9999;
        justify-content: center;
        align-items: center;
        top: 0;
        left: 0;

        .v-img {
            border-radius: 12px !important;
        }
    }
</style>
