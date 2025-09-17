<script setup>
import advantages from '~/assets/js/advantages';
import mockShops from '~/assets/js/mockShops';
</script>

<template>
    <div class="about-page">
        <div class="about-page__header header">
            <v-img
                gradient="to top right, rgba(100,115,201,.33), rgba(25,32,72,.7)"
                class="header__image"
                src="/main.webp"
                cover
                height="400px"
            >
                <div class="d-flex flex-column justify-center align-center header__image-container">
                    <div class="text-h2 header__title">
                        SHELKOVITSA
                    </div>
                    <div class="text-caption mt-4 text-center text-white">
                        Присутствуем на российском рынке с 2009 года и являемся одним и «пионеров» первой волны интернет шоппинга
                        в сегменте нижнего белья и предпостельной одежды. Нашим ориентиром является представление исключительно оригинальных фабричных
                        высококачественных товаров, соответствующих всем установленным параметрам качества, безопасности и функциональности,
                        с сохранением демократического уровня цен, доступного практически каждому покупателю.
                    </div>
                </div>
            </v-img>
        </div>

        <h2 class="text-h6 mt-4 text-center">
            Наши преимущества
        </h2>
        <div class="about-page__advantages mt-6">
            <about-advantage
                v-for="(item, key) in advantages"
                :key="key"
                :item="item"
            />
        </div>
        <div class="h2 text-h6 text-center mt-4">
            Обмен и возврат
        </div>
        <div class="about-page__description text-center text-sm-left mt-4 mb-4">
            В интересах сохранения здоровья и безопасности наших клиентов, ставя во главу угла этические принципы и нормы действующего законодательства, мы строго соблюдаем установленный запрет на возврат и обмен швейных и трикотажных изделий (изделия швейные и трикотажные бельевые, изделия чулочно-носочные), переданных покупателю после оплаты, в соответствии с «Перечнем непродовольственных товаров надлежащего качества, не подлежащих обмену», утвержденным постановлением Правительства Российской Федерации от 31 декабря 2020 г. № 2463.
            Тем самым мы <b>гарантируем</b>, что купленный Вами товар не был в употреблении и не примерялся.
        </div>

        <div class="h2 text-h6 text-center">
            Популярно сейчас
        </div>
        <div class="s-shop-carousel">
            <s-shop-item
                v-for="(item, key) in mockShops.splice(0, 3)"
                :key="key"
                :item="item"
            />
        </div>
        <div class="d-flex justify-center mt-4 mb-4">
            <vs-button
                type="flat"
                @click="navigateTo('catalog')"
            >
                Перейти в каталог
            </vs-button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.s-shop-carousel {
        margin-top: 40px;
        display: flex;
        gap: 20px;
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
            @media screen and (max-width: 768px) {
                font-size: 50px !important;
            }
        }

        &__image {
            border-radius: 12px;

            &-container {
                height: 100%;
                padding: 20px;
            }
        }
    }
</style>
