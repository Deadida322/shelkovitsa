import { defineStore } from 'pinia';

export const useMappingStore = defineStore('mapping', () => {
    const colors = ref({});
    const sizes = ref({});

    const { $api } = useNuxtApp();
    const getColors = () => {
        $api('/api/product-color')
            .then((res) => {
                res.forEach(item => colors.value[item.id] = item.name);
            });
    };

    const getSizes = () => {
        $api('/api/product-size')
            .then((res) => {
                res.forEach(item => sizes.value[item.id] = item.name);
            });
    };

    return {
        sizes,
        colors,
        getColors,
        getSizes,
    };
});
