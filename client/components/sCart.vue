<script setup>
    const opened = ref(false)
    const mockItems = [
        {
            title: "item 1",
            description: 'description of item 1',
            count: 2,
            img: '/mock-shop.jpg',
            price: 1023
        },
        {
            title: "item 1",
            description: 'description of item 1',
            count: 2,
            img: '/mock-shop.jpg',
            price: 1232
        }
    ]

    const toggle = () => opened.value = !opened.value
</script>

<template>
    <div 
        class="s-cart"
        :class="{
            's-cart_opened': opened
        }"
    >
        <div @click="toggle" class="s-cart__header header">
            <v-badge :content="mockItems.length">
                <v-icon>mdi-cart-outline</v-icon>
            </v-badge>
            <div class="header__text">
                <div class="header__title">
                    ВАША КОРЗИНА
                </div>
                <div 
                    class="header__icon aling-self-end"
                    
                >
                    <v-icon v-if="opened">mdi-chevron-down</v-icon>
                    <v-icon v-else>mdi-chevron-up</v-icon>
                </div>
            </div>
        </div>
        <div class="s-cart__body">
            <div v-for="item in mockItems" :key="item.count" class="s-cart__item cart-item">
                <v-img max-width="64px" height="64px" cover width="64px" class="cart-item__image" :rounded="8" :src="item.img"></v-img>
                <div class="cart-item__text">
                    <div class="cart-item__title">
                        {{ item.title }}
                    </div>
                    <div class="cart-item__subtitle">
                        {{ item.description }}
                    </div>
                </div>
                <div class="cart-item__actions text-center">
                    
                    <div class="cart-item__count align-center">
                        <vs-button 
                            size="small"
                            @click="item.count = item.count -1"
                        >
                            -
                        </vs-button>
                        <client-only>
                            <vs-input
                                class="count__input"
                                type="number"
                                width="20px"
                                v-model="item.count"
                            />
                        </client-only>
                        <vs-button size="small">
                            +
                        </vs-button>
                    </div>
                    <div class="cart-item__price mt-4">{{item.price * 2}} <span>₽</span></div>
                </div>
            </div>
        </div>
        <div class="s-cart__actions d-flex justify-end pt-4">
            <vs-button type="flat">
                Очистить
            </vs-button>
            <vs-button @click="navigateTo('/deliver')">
                Заказать
            </vs-button>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .s-cart {
        display: flex;
        position: fixed;
        bottom: 0;
        right: 20px;
        z-index: 99999999;
        width: 400px;
        box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2);
        background-color: white;
        border-radius:12px 12px 0px 0;
        padding: 20px;
        flex-direction: column;
        transition: .3s all ease-in;
        transform: translateY(calc(100% - 60px));

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