<script setup>
import { notification } from 'vuesax-alpha/lib/components/notification/src/notify.js';

const route = useRoute();
const shopItem = ref({
    title: 'Некоторый элемент',
    info: 'Lorem ipsum dolor sit amet consectetur. Vitae tincidunt tempor sed velit blandit nibh sed eu. Etiam mollis et maecenas nibh neque id nulla orci cursus. Eget aliquam quis purus et egestas elementum ut id adipiscing. Enim penatibus risus nisl dui ipsum.',
    images: [
        '/mock-shop.jpg',
        '/mock-shop-2.jpg',
    ],
    sizes: [
        '65A',
        '65B',
        '75C',
        '70D',
    ],
    colors: [
        'Бежевый',
        'Чёрный',
    ],
    available: 4,
    price: 1232,
});
const { $api } = useNuxtApp();
function addToCart() {
    notification({
        title: 'Добавлено!',
        content: `Отличный выбор! Товар добавлен в корзину`,
        position: 'bottom-center',
    });
}

const cartInfo = ref({});
const displayedImage = ref(shopItem.value.images[0]);
const showImage = ref(false);
$api(`/api/product/${route.params.article}`).then((res) => {
    console.log(res);
});
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
            {{ shopItem.title }}
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
                        v-for="(image, key) in shopItem.images"
                        :key="key"
                    >
                        <v-img
                            cover
                            class="carousel-image"
                            height="100px"
                            :src="image"
                            @click="displayedImage = image"
                        />
                    </s-slide>
                </s-carousel>
            </div>
            <div class="catalog-item__info mt-2">
                <h3 class="text-h6">
                    Описание товара
                </h3>
                <div class="item-info__description text-body1">
                    {{ shopItem.info }}
                </div>
                <h3 class="text-h6 mt-4">
                    Размеры в сетке Российских размеров
                </h3>
                <div class="item-info__description text-body1  mt-4">
                    {{ shopItem.sizes.join(", ") }}
                </div>
                <div class="item-info__to-cart mt-4 d-flex flex-column align-end">
                    <div class="item-info__select-container">
                        <client-only>
                            <div class="item-info__select">
                                <vs-select
                                    v-model="cartInfo.size"
                                    class="item-info__select"
                                    placeholder="Размер"
                                >
                                    <vs-option
                                        v-for="size in shopItem.sizes"
                                        :key="size"
                                        :label="size"
                                        :value="size"
                                    >
                                        {{ size }}
                                    </vs-option>
                                </vs-select>
                            </div>
                            <div class="item-info__select">
                                <vs-select
                                    v-model="cartInfo.color"
                                    class="item-info__select"
                                    placeholder="Цвет"
                                >
                                    <vs-option
                                        v-for="color in shopItem.colors"
                                        :key="color"
                                        :label="color"
                                        :value="color"
                                    >
                                        {{ color }}
                                    </vs-option>
                                </vs-select>
                            </div>
                        </client-only>
                    </div>
                    <s-count-input
                        v-model="cartInfo.count"
                        :max="shopItem.available"
                        class="mt-4"
                        label="Количество"
                    />
                    <div class="item-info__count-caption">
                        На складе <span>{{ shopItem.available }}</span> шт.
                    </div>
                    <div class="item-info__actions d-flex mt-4">
                        <vs-button
                            disabled
                            type="flat"
                        >
                            {{ shopItem.price }} ₽
                        </vs-button>
                        <vs-button @click="addToCart">
                            Добавить в корзину  <v-icon class="ml-1">
                                mdi-cart-outline
                            </v-icon>
                        </vs-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
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
