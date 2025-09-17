<script setup>
import { useCartStore, useMappingStore, useOrderStore } from '#imports';
import { mask as vMask } from 'vue-the-mask';
import { VsNotification } from 'vuesax-alpha';

definePageMeta({
    middleware: [
        // 'auth',
    ],
});
const config = useRuntimeConfig();
const base = config.public.apiBase;
const { $api } = useNuxtApp();
const deliveryTypes = ref([]);
$api(`/api/delivery-type`).then((res) => {
    deliveryTypes.value = res;
});

const orderStore = useOrderStore();
const cartStore = useCartStore();
const mappingStore = useMappingStore();

function onCountDown(count, index) {
    if (!count)
        cartStore.removeItem(index);
}

const step = ref(1);

function nextStep() {
    if (step.value < 2)
        return step.value++;
    $api('/api/order/create', { method: 'POST', body: { ...orderStore.order, orderProducts: cartStore.cart } }).then(() => {
        VsNotification({
            title: 'Отправлено!',
            content: 'Заказ отправлен, ожидайте связи',
            position: 'bottom-center',
            border: 'success',
        });
        cartStore.clearCart();
    });
}

// Добавляем SEO улучшения без удаления существующего кода
useHead({
    title: 'Корзина и доставка - Шелковица',
    meta: [
        {
            name: 'description',
            content: 'Корзина товаров интернет-магазина нижнего белья "Шелковица". Оформление заказа и условия доставки.',
        },
        {
            name: 'keywords',
            content: 'корзина, заказ, доставка, оформление заказа, шелковица, интернет магазин белья',
        },
        { property: 'og:title', content: 'Корзина и доставка - Шелковица' },
        { property: 'og:description', content: 'Корзина товаров интернет-магазина нижнего белья "Шелковица". Оформление заказа и условия доставки.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://ваш-сайт.рф/deliver' },
        { name: 'twitter:card', content: 'summary_large_image' },
    ],
    link: [
        { rel: 'canonical', href: 'https://ваш-сайт.рф/deliver' },
    ],
});
</script>

<template>
    <div class="deliver-page">
        <Head>
            <Title>Корзина</Title>
            <Meta name="description" content="Корзина товаров магазина Шелковица" />
        </Head>
        <h2 class="text-h6 mt-4">
            Ваша корзина
        </h2>
        <vs-alert
            shadow
            class="mt-4"
            color="#1A5CFF"
        >
            <template #icon>
                <v-icon size="40">
                    mdi-information
                </v-icon>
            </template>
            Скидка не распространяется на товары участвующие в акции
        </vs-alert>
        <div
            class="deliver__table"
            :class="{ 'pa-4': !cartStore.cart.length }"
        >
            <vs-table v-if="cartStore.cart.length">
                <template #thead>
                    <vs-tr>
                        <vs-th />
                        <vs-th>
                            Наименование
                        </vs-th>
                        <vs-th>
                            Цвет
                        </vs-th>
                        <vs-th>
                            Размер
                        </vs-th>
                        <vs-th>
                            Количество
                        </vs-th>
                        <vs-th>
                            Цена
                        </vs-th>
                        <vs-th />
                    </vs-tr>
                </template>
                <template #tbody>
                    <vs-tr
                        v-for="(tr, i) in cartStore.cart"
                        :key="i"
                        :data="tr"
                    >
                        <vs-td width="70px">
                            <v-img
                                class="deliver-table__image"
                                cover
                                width="64px"
                                height="64px"
                                :src="`${base}/${tr.logo}`"
                            />
                        </vs-td>
                        <vs-td>
                            {{ tr.name }}
                        </vs-td>
                        <vs-td>
                            {{ mappingStore.colors[tr.productColorId] }}
                        </vs-td>
                        <vs-td>
                            {{ mappingStore.sizes[tr.productSizeId] }}
                        </vs-td>
                        <vs-td>
                            <s-count-input v-model="tr.amount" @update:model-value="onCountDown($event, i)" />
                        </vs-td>
                        <vs-td width="110px">
                            <vs-button
                                disabled
                                type="flat"
                            >
                                {{ tr.price }} ₽
                            </vs-button>
                        </vs-td>
                        <vs-td>
                            <vs-button
                                circle
                                icon
                                floating
                                @click="cartStore.removeItem(i)"
                            >
                                <i class="mdi-close mdi v-icon" />
                            </vs-button>
                        </vs-td>
                    </vs-tr>
                </template>
            </vs-table>
            <div v-else class="link" @click="navigateTo('/catalog')">
                <vs-alert
                    class="mt-4 alert"
                    color="success"
                >
                    <template #icon>
                        <v-icon size="40">
                            mdi-cart-outline
                        </v-icon>
                    </template>
                    В вашей корзине нет товаров
                    <nuxt-link to="/catalog">
                        перейти в каталог
                    </nuxt-link>
                </vs-alert>
            </div>
            <div class="deliver-table__actions d-flex justify-end pa-4 align-center">
                <div class="text-body1">
                    Всего:
                </div>
                <vs-button
                    class="mr-2 ml-2"
                    disabled
                    type="flat"
                >
                    {{ cartStore.cart.reduce((a, item) => a += item.price * item.amount, 0) }} ₽
                </vs-button>
                <vs-button @click="cartStore.clearCart">
                    Очистить
                </vs-button>
            </div>
        </div>
        <template v-if="cartStore.cart.length">
            <h2 class="text-h6 mt-4">
                Оформление заказа
            </h2>
            <s-validate v-slot="{ submit }" @submit="nextStep">
                <v-stepper
                    v-model="step"
                    class="deliver__stepper"
                >
                    <v-stepper-header>
                        <v-stepper-item
                            step="Step {{ 0 }}"
                            :value="1"
                            title="Данные получателя"
                            edit-icon="mdi-alert-outline"
                            complete-icon="mdi-check"
                            :editable="step > 1"
                            :complete="step > 1"
                        />
                        <v-stepper-item
                            step="Step {{ 1 }}"
                            :value="2"
                            :editable="step > 2"
                            :complete="step > 2"
                            title="Данные доставки"
                            edit-icon="mdi-package"
                        />
                    </v-stepper-header>
                    <v-stepper-window>
                        <v-stepper-window-item
                            :value="1"
                        >
                            <div class="deliver__form">
                                <s-input
                                    v-model="orderStore.order.mail"
                                    required
                                    email
                                    class="s-input"
                                    type="email"
                                    placeholder="email"
                                    icon="email"
                                />
                                <s-input
                                    v-model="orderStore.order.fio"
                                    class="s-input"
                                    placeholder="ФИО"
                                    icon="account-outline"
                                    required
                                />

                                <s-input
                                    v-model="orderStore.order.tel"
                                    v-mask="'+7(###)###-##-##'"
                                    class="s-input"
                                    type="phone"
                                    placeholder="Номер телефона"
                                    icon="phone"
                                    :min-length="16"
                                    required
                                >
                                    <template #icon>
                                        <v-icon>mdi-phone</v-icon>
                                    </template>
                                </s-input>
                                <s-input
                                    v-model="orderStore.order.description"
                                    class="s-input"
                                    placeholder="Дополнительная информация"
                                    icon="text-box-outline"
                                />
                            </div>
                        </v-stepper-window-item>
                        <v-stepper-window-item
                            :value="2"
                        >
                            <div class="deliver__form">
                                <s-input
                                    v-model="orderStore.order.region"
                                    required
                                    class="s-input"
                                    type="email"
                                    placeholder="Регион"
                                    icon="map"
                                />
                                <s-input
                                    v-model="orderStore.order.address"
                                    class="s-input"
                                    placeholder="Адрес"
                                    icon="map-marker"
                                    required
                                />

                                <s-select
                                    v-model="orderStore.order.deliveryTypeId"
                                    required
                                    class="s-input"
                                    :options="deliveryTypes"
                                    label-key="name"
                                    value-key="id"
                                    placeholder="Варианты доставки"
                                />
                            </div>
                        </v-stepper-window-item>
                    </v-stepper-window>
                    <div class="d-flex pa-4 justify-end">
                        <vs-button
                            v-if="step !== 2"
                            @click="submit"
                        >
                            Далее
                        </vs-button>
                        <vs-button
                            v-else
                            @click="submit"
                        >
                            Отправить
                        </vs-button>
                    </div>
                </v-stepper>
            </s-validate>
        </template>

        <vs-alert
            class="mt-4 alert"
            color="#1A5CFF"
        >
            <template #icon>
                <v-icon size="32">
                    mdi-information
                </v-icon>
            </template>
            <ul class="ml-2">
                <li>
                    Просьба указывать в комментарии, что вам нужна примерка
                </li>
                <li>
                    При самовывозе просьба не менее, че за час сообщить, о том, что Вы подъедите за заказом
                </li>
                <li>
                    Пункт выдачи находится по адресу Москва, Леснорядский переулок, д. 18, стр. 19А
                </li>
                <li>
                    Режим работы:
                    <br>
                    пн. - пт. 10:00 - 17:00
                    <br>
                    сб. - 10:00 - 15:00
                    <br>
                    вс. - выходной
                </li>
                <li>Заказы принимаются с 10:00 - 18:00 по телефону и круглосуточно через сайт, обрабатываются до 15:00, заказы оставленные после, преносятся на следующий день</li>
            </ul>
        </vs-alert>
    </div>
</template>

<style lang="scss">
    .link {
        cursor: pointer;
    }
    .about-page {
        &__advantages {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
    }

    .header {
        &__title {
            color: $primary;

        }

        &__image {
            border-radius: 12px;

            &-container {
                height: 100%;
                padding: 20px;
            }
        }
    }

    .deliver {
        &__table {
            box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2);
            margin-top: 30px;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        &__form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        &__stepper {
            margin-top: 20px;
            border-radius: 12px;
            box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2) !important;
        }
    }

    .deliver-table {
        &__image {
            border-radius: 12px;
        }
    }

    .vs-select {
        max-width: 100%;
    }
</style>

<style lang="scss" scoped>
    .alert {
        z-index: -1;
    }
</style>
