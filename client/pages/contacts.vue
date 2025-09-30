<script setup>
useHead({
  title: 'Контакты - Шелковица',
  meta: [
    { 
      name: 'description', 
      content: 'Контактная информация интернет-магазина нижнего белья "Шелковица" - телефоны, адрес, карта проезда.' 
    },
    { 
      name: 'keywords', 
      content: 'контакты, телефоны, адрес, карта проезда, шелковица, интернет магазин белья' 
    },
    { property: 'og:title', content: 'Контакты - Шелковица' },
    { property: 'og:description', content: 'Контактная информация интернет-магазина нижнего белья "Шелковица" - телефоны, адрес, карта проезда.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://shelkovitsa.ru/contacts' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  link: [
    { rel: 'canonical', href: 'https://shelkovitsa.ru/contacts' }
  ]
});
</script>

<template>
    <div class="about-page">
        <h2 class="text-h6 mt-4">
            КОНТАКТЫ
        </h2>
        <div class="text-body-1 mt-4">
            Вы можете связаться с нами по номерам
        </div>
        <div class="d-flex align-center mt-4 ml-4">
            <v-icon>mdi-phone</v-icon><a
                class="ml-2"
                href="tel:88005555900"
            >88005555900</a>
        </div>
        <div class="d-flex align-center mt-4 ml-4">
            <v-icon>mdi-phone</v-icon>
            <a
                class="ml-2"
                href="tel:88005555900"
            >
                88005555900
            </a>
        </div>
        <div class="text-body-1 mt-4">
            Либо найти на карте
        </div>
        <div class="contact__map mt-4">
            <iframe
                src="https://yandex.ru/map-widget/v1/?um=constructor%3A8aec74c2534299d8e4e760eb2ee73a84c8ff428b0687e1771396d10bb52279b6&amp;source=constructor"
                width="100%"
                height="500"
                frameborder="0"
                title="Карта проезда до Шелковица"
            />
        </div>
    </div>
</template>

<style lang="scss">
.contact__map {
    box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2);
    border-radius: 12px;
}
</style>