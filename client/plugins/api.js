export default defineNuxtPlugin(() => {
    const api = $fetch.create({
        baseURL: 'http://localhost:8000',
    });

    return {
        provide: {
            api,
        },
    };
});
