<template>
    <div class="catalog-page">
        <h2 class="text-h6 mt-4 mb-4">Каталог</h2>
        <client-only>
            <vs-input class="s-input" placeholder="Поиск в категории" icon-after>
                <template #icon>
                    <v-icon>mdi-magnify</v-icon>
                </template>
            </vs-input>
        </client-only>
        <v-breadcrumbs :items="['Каталог', 'Категория', 'Подкатегория']"></v-breadcrumbs>
        <vs-alert color="#1A5CFF">
            <template #icon>
                <v-icon size="40">mdi-information</v-icon>
            </template>
            По вашему запросу найдено 120 вариантов!
        </vs-alert>
        <div class="shops-container">
            <div class="shop-item" v-for="item in mockShops">
                <s-shop-item @click="navigateTo('/catalog/1')" :item="item"></s-shop-item>
            </div>
            
        </div>
        <div class="d-flex justify-end mt-10">
            <vs-pagination v-model="page" :layout="['prev', 'pager', 'next']" :page-size="10" :total="400" />
        </div>
    </div>
</template>

<script setup>
import advantages from '~/assets/js/advantages';
import mockShops from '~/assets/js/mockShops';
const page = ref(1);

const toDisplay = ref(4);

const toggle = () => {
    if (toDisplay.value != 4) {
        toDisplay.value = 4
    } else {
        toDisplay.value = advantages.length
    }
}

const computedAdvantages = computed(()=>advantages.slice(0, toDisplay.value))

const buttonLabel = computed(() => {
    if (toDisplay.value != 4) {
        return "Смотреть меньше";
    } else {
        return "Смотреть ещё";
    }
})
</script>

<style lang="scss">
    .shops-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 14px;
        margin-top: 30px;
        .shop-item {
            flex: 0 0 calc(33.3333% - 10px);
            margin-bottom: 14px;
        }
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
</style>