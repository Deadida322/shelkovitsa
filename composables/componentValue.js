export default function useComponentValue({modelValue, emit}) {
    console.log(modelValue)
    return computed({
        set: (val) => emit("update:model-value", val),
        get: () => modelValue?.value
    })
} 