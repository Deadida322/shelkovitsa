<script setup>
    const address = 'Москва, Леснорядский переулок, 18с19А';
    const lon = 37.677382;
    const lat = 55.783909;
    // рамка карты вокруг метки (~масштаб 17)
    const bbox = [lon - 0.0054, lat - 0.0015, lon + 0.0054, lat + 0.0015].join(',');
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
    const osmMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
    const yandexMapUrl = `https://yandex.ru/maps/?pt=${lon},${lat}&z=17&l=map`;

    useHead({
        title: 'Контакты - Шелковица',
        meta: [
            {
                name: 'description',
                content: 'Контактная информация интернет-магазина нижнего белья "Шелковица" - телефоны, адрес, карта проезда.',
            },
            {
                name: 'keywords',
                content: 'контакты, телефоны, адрес, карта проезда, шелковица, интернет магазин белья',
            },
            { property: 'og:title', content: 'Контакты - Шелковица' },
            { property: 'og:description', content: 'Контактная информация интернет-магазина нижнего белья "Шелковица" - телефоны, адрес, карта проезда.' },
            { property: 'og:type', content: 'website' },
            { property: 'og:url', content: 'https://shelkovitsa.ru/contacts' },
            { name: 'twitter:card', content: 'summary_large_image' },
        ],
        link: [
            { rel: 'canonical', href: 'https://shelkovitsa.ru/contacts' },
        ],
    });
</script>

<template>
    <div class="about-page">
        <h2 class="text-h6 mt-4">
            КОНТАКТЫ
        </h2>
        <div class="text-body-1 mt-4">
            Вы можете связаться с нами:
        </div>

        <div class="d-flex align-center mt-1 ml-2">
            <a href="tel:+79255859439" class="s-footer__item a">
                +7 925 585 94 39
            </a>
        </div>
        <div class="d-flex align-center mt-1 ml-2">
            <a href="mailto:shelkovitsa2009@yandex.ru" class="s-footer__item a">
                shelkovitsa2009@yandex.ru
            </a>
        </div>
        <div class="text-body-1 mt-4">
            Либо найти на карте
        </div>
        <div class="d-flex align-center mt-1 ml-2">
            {{ address }}
        </div>
        <!--
            Карта OpenStreetMap вместо виджета Яндекс.Конструктора: тот показывает
            рекламные метки, а скрыть их снаружи нельзя (iframe чужого домена).
        -->
        <div class="contact__map mt-4">
            <iframe
                :src="mapSrc"
                width="100%"
                height="500"
                frameborder="0"
                loading="lazy"
                title="Карта проезда до Шелковица"
            />
        </div>
        <div class="d-flex flex-wrap mt-2 ml-2">
            <a
                :href="yandexMapUrl"
                target="_blank"
                rel="noopener"
                class="s-footer__item a mr-6"
            >
                Открыть в Яндекс Картах
            </a>
            <a
                :href="osmMapUrl"
                target="_blank"
                rel="noopener"
                class="s-footer__item a"
            >
                Открыть в OpenStreetMap
            </a>
        </div>
    </div>
</template>

<style lang="scss">
.contact__map {
    box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2);
    border-radius: 12px;
}
</style>
