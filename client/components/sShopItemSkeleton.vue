<template>
    <div class="skeleton-card">
        <div class="skeleton-image" />
        <div class="skeleton-content">
            <div class="skeleton-title" />
            <div class="skeleton-text" />
            <div class="skeleton-bottom">
                <div class="skeleton-button" />
                <div class="skeleton-price" />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .skeleton-card {
        background-color: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .skeleton-image {
        height: 200px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }

    .skeleton-content {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
    }

    .skeleton-title {
        height: 1.2rem;
        width: 70%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
    }

    .skeleton-text {
        height: 1rem;
        width: 90%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
        flex: 1;
    }

    .skeleton-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
    }

    .skeleton-button {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }

    .skeleton-price {
        height: 1.2rem;
        width: 60px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
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
