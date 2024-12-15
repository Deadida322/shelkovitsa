<script setup>
import { useCartStore, useMappingStore } from '#imports';

const cartStore = useCartStore();
const mapps = useMappingStore();
const opened = ref(false);

const toggle = () => opened.value = !opened.value;

function onDelete(index) {
    if (cartStore.cart[index].amount === 0) {
        cartStore.cart.splice(index, 1);
    }
}
</script>

<template>
    <div
        class="s-cart"
        :class="{
            's-cart_opened': opened,
        }"
    >
        <div class="s-cart__header header" @click="toggle">
            <v-badge :content="cartStore.cart.length">
                <v-icon>mdi-cart-outline</v-icon>
            </v-badge>
            <div class="header__text">
                <div class="header__title">
                    ВАША КОРЗИНА
                </div>
                <div
                    class="header__icon aling-self-end"
                >
                    <v-icon v-if="opened">
                        mdi-chevron-down
                    </v-icon>
                    <v-icon v-else>
                        mdi-chevron-up
                    </v-icon>
                </div>
            </div>
        </div>
        <div class="s-cart__body">
            <template v-if="cartStore.cart.length">
                <div v-for="(item, index) in cartStore.cart" :key="item.count" class="s-cart__item cart-item">
                    <v-img max-width="64px" height="64px" cover width="64px" class="cart-item__image" :rounded="8" src="/mock-shop.jpg" />
                    <div class="cart-item__text">
                        <div class="cart-item__title">
                            {{ item.name }}
                        </div>
                        <div class="cart-item__subtitle">
                            {{ mapps.colors[item.productColorId] }} / {{ mapps.sizes[item.productSizeId] }}
                        </div>
                    </div>
                    <div class="cart-item__actions text-center">
                        <div class="cart-item__count align-center">
                            <s-count-input v-model="item.amount" :max="item.maxAmount" @update:model-value="onDelete(index)" />
                        </div>
                        <div class="cart-item__price mt-2">
                            {{ item.price * item.amount }} <span>₽</span>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else>
                Добавьте
                <nuxt-link class="link" to="/catalog">
                    товары
                </nuxt-link> в корзину
            </template>
        </div>
        <div class="s-cart__actions d-flex justify-end pt-4">
            <vs-button type="flat" @click="cartStore.clearCart">
                Очистить
            </vs-button>
            <vs-button @click="navigateTo('/deliver')">
                Заказать
            </vs-button>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .link {
        color: $primary;
    }

    .s-cart {
        display: flex;
        position: fixed;
        z-index: 1;
        bottom: 0;
        right: 20px;
        width: 400px;
        box-shadow: 0px 0px 6px 0px rgba(34, 60, 80, 0.2);
        background-color: white;
        border-radius: 12px 12px 0px 0;
        padding: 20px;
        flex-direction: column;
        transition: .3s all ease-in;
        transform: translateY(calc(100% - 60px));

        @media screen and (max-width: 1200px) {
            width: 300px;
        }

        @media screen and (max-width: 800px) {
            padding: 12px;
            transform: translateY(calc(100% - 44px));
            right: 10px;
        }

        @media screen and (max-width: 600px) {
            width: 98%;
            right: 1%
        }

        &_opened {
            transform: translate(0);
        }

        &__item {
            margin-bottom: 20px;
            display: flex;
            justify-content: flex-start;
            align-items: center;
        }

        &__body {
            padding-top: 20px;
            max-height: 300px;
            overflow-y: auto
        }
    }

    .header {
        display: flex;
        gap: 20px;
        width: 100%;
        cursor: pointer;

        &__text {
            display: flex;
            width: 100%;
            justify-content: space-between;
        }

    }

    .cart-item {
        gap: 12px;

        &__image {
            border-radius: 8px;
        }

        &__subtitle {
            margin-top: 4px;
            color: #6C5151;
            font-size: 10px;
        }

        &__text {
            width: 100%;
        }

        &__count {
            display: flex;
            gap: 4px;
        }

        &__price {
            span {
                color: $primary;
            }
        }
    }

    ::v-deep(.count__input) {
        width: 40px !important;
    }
</style>
