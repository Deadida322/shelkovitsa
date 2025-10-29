import { defineStore } from 'pinia';

export const useMappingStore = defineStore('mapping', () => {
    const colors = ref({});
    const sizes = ref({});
    const plainColors = ref([]);
    const plainSizes = ref([]);
    const { $api } = useNuxtApp();
    const getColors = () => {
        $api('/api/product-color')
            .then((res) => {
                plainColors.value = res;
                res.forEach(item => colors.value[item.id] = item.name);
            });
    };

    const getSizes = () => {
        $api('/api/product-size')
            .then((res) => {
                plainSizes.value = res;
                res.forEach(item => sizes.value[item.id] = item.name);
            });
    };

    return {
        sizes,
        colors,
        plainColors,
        plainSizes,
        getColors,
        getSizes,
    };
});
