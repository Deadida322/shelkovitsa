import { defineStore } from 'pinia';
import { formatRuPhoneMask } from '~/utils/phone';

export const useOrderStore = defineStore('order', () => {
    const order = ref({
        mail: '',
        fio: '',
        tel: '',
        description: '',
        region: '',
        address: '',
        deliveryTypeId: undefined,
    });

    /** Подставить профиль, не затирая уже введённые поля. Возвращает true, если что-то записали. */
    const prefillFromUser = (user) => {
        if (!user) return false;
        let changed = false;
        const next = { ...order.value };

        if (!next.mail && user.mail) {
            next.mail = user.mail;
            changed = true;
        }
        if (!next.fio && user.fio) {
            next.fio = user.fio;
            changed = true;
        }
        if (!next.tel && user.tel) {
            next.tel = formatRuPhoneMask(user.tel);
            changed = true;
        }

        if (changed) {
            // замена объекта целиком — надёжнее для Pinia + vs-input
            order.value = next;
        }
        return changed;
    };

    return {
        order,
        prefillFromUser,
    };
});
