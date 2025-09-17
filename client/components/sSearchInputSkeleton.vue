<template>
    <div class="search-input-skeleton">
        <div class="skeleton-input" />
    </div>
</template>

<style lang="scss" scoped>
    .search-input-skeleton {
        width: 100%;
        margin: 1rem 0;
    }
    
    .skeleton-input {
        height: 40px;
        width: 100%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 8px;
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