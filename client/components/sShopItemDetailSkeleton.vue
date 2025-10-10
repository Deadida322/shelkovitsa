<template>
    <div class="catalog-item-page catalog-item">
        <v-skeleton-loader
            type="heading"
            class="mb-4"
            max-width="400"
        />

        <div class="catalog-item__container d-flex">
            <div class="catalog-item__images mt-4">
                <v-skeleton-loader
                    type="image"
                    height="200"
                    class="mb-4"
                />
                <v-skeleton-loader
                    type="card"
                    height="100"
                    class="mt-4"
                />
            </div>

            <div class="catalog-item__info mt-2">
                <v-skeleton-loader
                    type="heading"
                    class="mb-4"
                    max-width="200"
                />
                <v-skeleton-loader
                    type="text"
                    class="mb-4"
                    max-width="100%"
                />

                <v-skeleton-loader
                    type="heading"
                    class="mt-4 mb-4"
                    max-width="300"
                />
                <v-skeleton-loader
                    type="text"
                    class="mb-4"
                    max-width="100%"
                />

                <v-skeleton-loader
                    type="list-item"
                    class="mb-4"
                    height="56"
                />
                <v-skeleton-loader
                    type="list-item"
                    class="mb-4"
                    height="56"
                />

                <v-skeleton-loader
                    type="list-item"
                    class="mb-4"
                    height="56"
                />
                <div class="d-flex mt-4 justify-end">
                    <v-skeleton-loader
                        type="button"
                        class="mr-2"
                        width="120"
                        height="40"
                    />
                    <v-skeleton-loader
                        type="button"
                        width="200"
                        height="40"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// Стили не требуются, так как мы используем встроенные стили Vuetify
</style>
