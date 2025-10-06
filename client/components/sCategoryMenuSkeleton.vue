<template>
    <div class="skeleton-loader">
        <div
            v-for="i in 3"
            :key="i"
            class="skeleton"
        />
    </div>
</template>

<style lang="scss" scoped>
    .skeleton-loader {
        width: 100%;
        gap: 0.5rem;
        display: flex;
        flex-direction: column;
    }
    .skeleton {
        height: 2rem;
        width: 100%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 6px;
    }

    @keyframes loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
</style>
