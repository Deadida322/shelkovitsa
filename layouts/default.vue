<template>
    <div class="shelkovitsa-main">
        <s-header></s-header>
        <div class="shelkovitsa-body">
            <div class="shelkovitsa-body__main">
                <slot/>
            </div>
            <div class="shelkovitsa-body__menu">
                <s-category-menu></s-category-menu>
            </div>
            
        </div>
        <s-footer class="mt-12"></s-footer>
        <s-cart></s-cart>
    </div>
</template>

<style lang="scss">
.shelkovitsa-body {
    min-height: calc(100vh - 400px);
    margin-top: 100px;
    padding: 0 160px;
    display: flex;
    gap: 40px;
    width: 100%;

    &__menu {
        min-width: 300px;
    }

    &__main {
        width: 100%;
    }
}
</style>