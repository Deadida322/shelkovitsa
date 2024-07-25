<template>
    <div class="about-page">
        
        <h2 class="text-h6 mt-4">КОНТАКТЫ</h2>
        <div class="text-body-1 mt-4">Вы можете связаться с нами по номерам</div>
        <div class="d-flex align-center mt-4 ml-4">
            <v-icon>mdi-phone</v-icon><a class="ml-2" href="tel:88005555900">88005555900</a>
        </div>
        <div class="d-flex align-center mt-4 ml-4">
            <v-icon>mdi-phone</v-icon><a class="ml-2" href="tel:88005555900">88005555900</a>
        </div>
        <div class="text-body-1 mt-4">Либо найти на карте</div>
        <div class="contact__map mt-4">
            <iframe src="https://yandex.ru/map-widget/v1/?um=constructor%3A8aec74c2534299d8e4e760eb2ee73a84c8ff428b0687e1771396d10bb52279b6&amp;source=constructor" width="100%" height="500" frameborder="0"></iframe>
        </div>
    </div>
</template>

<script setup>


</script>

<style lang="scss">
    .contact__map {
        box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2);
        border-radius: 12px;
    }
</style>