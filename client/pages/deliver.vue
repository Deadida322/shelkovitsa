<script setup>
    const mockItems = ref([
        {
            title: "item 1",
            description: 'description of item 1',
            count: 2,
            img: '/mock-shop.jpg',
            color: "Белый",
            size: 12,
            price: 1023
        },
        {
            title: "item 1",
            description: 'description of item 1',
            count: 2,
            img: '/mock-shop.jpg',
            color: "Бежевый",
            size: 11,
            price: 1232
        }
    ])
    
    const step = ref(1);
    const clearCart = () => mockItems.value = []
</script>

<template>
    <div class="deliver-page">
        <h2 class="text-h6 mt-4">Ваша корзина</h2>
        <vs-alert shadow class="mt-4" color="#1A5CFF" >
            <template #icon>
                <v-icon size="40">mdi-information</v-icon>
            </template>
            Скидка не распространяется на товары участвующие в акции
        </vs-alert>
        <div class="deliver__table"  :class="{'pa-4': !mockItems.length}">
            <vs-table v-if="mockItems.length">
                <template #thead>
                    <vs-tr>
                        <vs-th>
                        </vs-th>
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
                        <vs-th>
                        </vs-th>
                    </vs-tr>
                </template>
                <template #tbody>
                    <vs-tr
                        :key="i"
                        v-for="(tr, i) in mockItems"
                        :data="tr"
                    >
                        <vs-td width="70px">
                            <v-img class="deliver-table__image" cover width="64px" height="64px" :src="tr.img"></v-img>
                        </vs-td>
                        <vs-td>
                            {{ tr.title }}
                        </vs-td>
                        <vs-td>
                            {{ tr.color }}
                        </vs-td>
                        <vs-td>
                            {{ tr.size }}
                        </vs-td>
                        <vs-td>
                            <vs-button disabled type="flat">{{tr.price}} ₽</vs-button>
                        </vs-td>
                        <vs-td>
                            <s-count-input v-model="tr.count"></s-count-input>
                        </vs-td>
                        <vs-td>
                            <vs-button
                                circle
                                icon
                                floating
                            >
                                <i class="mdi-close mdi v-icon"></i>
                            </vs-button>
                        </vs-td>
                    </vs-tr>
                </template>
            </vs-table>
            <div v-else>
                <vs-alert class="mt-4" color="success">
                    <template #icon>
                        <v-icon size="40">mdi-cart-outline</v-icon>
                    </template>
                    В вашей корзине нет товаров <nuxt-link to="/catalog">перейти в каталог</nuxt-link>
                </vs-alert>
            </div>
            <div class="deliver-table__actions d-flex justify-end pa-4 align-center">
                <div class="text-body1">Всего:</div>
                <vs-button class="mr-2 ml-2" disabled type="flat">{{mockItems.reduce((a, item)=>a += item.price * item.count, 0)}} ₽</vs-button>
                <vs-button @click="clearCart">Очистить</vs-button>
            </div>
        </div>
        <h2 class="text-h6 mt-4">Оформление заказа</h2>

        <v-stepper class="deliver__stepper" v-model="step">
            <template v-slot:default="{ prev, next }">
                <v-stepper-header>
                    <v-stepper-item
                        :step="`Step {{ 0 }}`"
                        :value="1"
                        title="Данные получателя"
                        edit-icon="mdi-alert-outline"
                        complete-icon="mdi-check"
                        :complete="step > 1"
                        editable
                    ></v-stepper-item>
                    <v-stepper-item
                        :step="`Step {{ 1 }}`"
                        :value="2"
                        :complete="step > 2"
                        title="Данные доставки"
                        editable
                        edit-icon="mdi-package"
                    ></v-stepper-item>
                    <v-stepper-item
                        :step="`Step {{ 2 }}`"
                        :value="3"
                        :complete="step > 3"
                        title="Варианты оплаты"
                        editable
                        edit-icon="mdi-credit-card-outline"
                    ></v-stepper-item>
                </v-stepper-header>
                <v-stepper-window>
                    <v-stepper-window-item
                        :value="1"
                    >
                        <div class="deliver__form">
                            <vs-input class="s-input" type="email" placeholder="email"> 
                                <template #icon>
                                    <v-icon>mdi-email</v-icon>
                                </template>
                            </vs-input>
                            <vs-input class="s-input" type="email" placeholder="ФИО"> 
                                <template #icon>
                                    <v-icon>mdi-account-outline</v-icon>
                                </template>
                            </vs-input>

                            <vs-input class="s-input" type="phone" placeholder="Номер телефона"> 
                                <template #icon>
                                    <v-icon>mdi-phone</v-icon>
                                </template>
                            </vs-input>
                            <vs-input class="s-input" placeholder="Дополнительная информация"> 
                                <template #icon>
                                    <v-icon>mdi-text-box-outline</v-icon>
                                </template>
                            </vs-input>
                        </div>
                    </v-stepper-window-item>
                    <v-stepper-window-item
                        :value="2"
                    >
                    <div class="deliver__form">
                        <vs-input class="s-input" type="email" placeholder="Регион"> 
                            <template #icon>
                                <v-icon>mdi-map</v-icon>
                            </template>
                        </vs-input>
                        <vs-input class="s-input" type="email" placeholder="Населённый пункт"> 
                            <template #icon>
                                <v-icon>mdi-map-marker</v-icon>
                            </template>
                        </vs-input>

                        <vs-select class="s-input" placeholder="Варианты доставки"> 
                            <template #icon>
                                <v-icon>mdi-text-box-outline</v-icon>
                            </template>
                        </vs-select>
                    </div>
                    </v-stepper-window-item>
                    <v-stepper-window-item
                        :value="3"
                    >
                    <div class="deliver__form">
                        <vs-input class="s-input" placeholder="Улица"> 
                            <template #icon>
                                <v-icon>mdi-map-marker-radius</v-icon>
                            </template>
                        </vs-input>
                        <vs-input class="s-input" placeholder="Дом"> 
                            <template #icon>
                                <v-icon>mdi-home-account</v-icon>
                            </template>
                        </vs-input>

                        <vs-input class="s-input" type="phone" placeholder="Квартира/офис"> 
                            <template #icon>
                                <v-icon>mdi-office-building</v-icon>
                            </template>
                        </vs-input>
                        <vs-select class="s-input" placeholder="Варианты доставки"> 
                            
                        </vs-select>
                    </div>
                    </v-stepper-window-item>
                </v-stepper-window>
                <div class="d-flex pa-4 justify-end">
                    <vs-button v-if="step!=3" @click="next">Далее</vs-button>
                    <vs-button v-else @click="send">Отправить</vs-button>
                </div>
            </template>
        </v-stepper>

        <vs-alert class="mt-4" color="#1A5CFF">
            <template #icon>
                <v-icon size="32">mdi-information</v-icon>
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