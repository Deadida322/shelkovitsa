<script setup>
const { $api } = useNuxtApp();
const isDeletedOther = ref(false);

function updateXlsx(file) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('isDeletedOther', isDeletedOther.value);
    $api('/api/product/upload', { method: 'POST', body: formData });
}
</script>

<template>
    <div class="admin-products pa-2">
        <div class="d-flex align-center">
            <v-file-input
                density="compact"
                hide-details
                label="Загрузить эксель"
                variant="solo-filled"
                @update:model-value="updateXlsx"
            />
            <v-checkbox
                v-model="isDeletedOther"
                v-tooltip="'При установки данного чекбокса, товары, указанные в файле полностью перезапишут текущие'"
                class="ml-2"
                color="red"
                hide-details
                label="Обновить целиком"
            />
        </div>
    </div>
</template>
