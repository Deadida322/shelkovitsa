<script setup>
import advantages from '~/assets/js/advantages';
import mockShops from '~/assets/js/mockShops';
import useBreakpoints from '~/composables/breakpoints';

const bp = useBreakpoints();
const toDisplay = ref(4);

function toggle() {
    if (toDisplay.value != 4) {
        toDisplay.value = 4;
    }
    else {
        toDisplay.value = advantages.length;
    }
}

const computedAdvantages = computed(() => advantages.slice(0, toDisplay.value));

const buttonLabel = computed(() => {
    if (toDisplay.value !== 4) {
        return 'Смотреть меньше';
    }
    else {
        return 'Смотреть ещё';
    }
});
</script>

<template>
    <div class="about-page">
        <div class="about-page__header header">
            <v-img
                gradient="to top right, rgba(100,115,201,.33), rgba(25,32,72,.7)"
                class="header__image"
                src="/about-header.jpg"
                cover
                height="400px"
            >
                <div class="d-flex flex-column justify-center align-center header__image-container">
                    <div class="text-h2 header__title">
                        SHELKOVITSA
                    </div>
                    <div class="text-caption mt-4 text-center text-white">
                        Lorem ipsum dolor sit amet consectetur. Nulla dignissim dolor pharetra non accumsan tincidunt sed feugiat. Id lacus diam eget euismod sed. Tincidunt vel vel eget sed congue gravida habitant morbi lorem. In pharetra non nec tortor. Lacinia a ultrices in hac donec diam dui enim viverra. Vitae massa enim sed lacus sit. Congue ac cras fermentum duis. Egestas urna fermentum urna pulvinar et. Urna platea enim volutpat elementum faucibus. Nunc vel sed viverra et at leo. Neque euismod ultricies a vitae. Sed eget sed gravida id nibh. Ipsum fermentum fusce phasellus duis congue blandit elementum sit aliquet.
                    </div>
                </div>
            </v-img>
        </div>

        <h2 class="text-h6 mt-4">
            Наши преимущества
        </h2>
        <div class="about-page__advantages mt-6">
            <about-advantage
                v-for="item in computedAdvantages"
                :item="item"
            />
        </div>
        <div class="d-flex justify-center mt-4 mb-4">
            <vs-button
                type="flat"
                @click="toggle"
            >
                {{ buttonLabel }}
            </vs-button>
        </div>
        <div class="about-page__description mt-4 mb-4">
            Lorem ipsum dolor sit amet consectetur. Nulla dignissim dolor pharetra non accumsan tincidunt sed feugiat. Id lacus diam eget euismod sed. Tincidunt vel vel eget sed congue gravida habitant morbi lorem. In pharetra non nec tortor. Lacinia a ultrices in hac donec diam dui enim viverra. Vitae massa enim sed lacus sit. Congue ac cras fermentum duis. Egestas urna fermentum urna pulvinar et. Urna platea enim volutpat elementum faucibus. Nunc vel sed viverra et at leo. Neque euismod ultricies a vitae. Sed eget sed gravida id nibh. Ipsum fermentum fusce phasellus duis congue blandit elementum sit aliquet.
        </div>

        <div class="h2 text-h6 text-center">
            Популярно сейчас
        </div>
        <div class="s-shop-carousel">
            <client-only>
                <s-shop-item
                    v-for="(item, key) in mockShops.splice(0, bp.isMobile ? 2 : 3)"
                    :key="key"
                    :item="item"
                />
            </client-only>
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
        @media screen and (max-width: 600px) {
            margin-top: -80px;
        }

        &__advantages {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
    }

    .header {
        &__title {
            color: $primary;

            @media screen and (max-width: 600px) {
                font-size: 24px !important;
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
