import useApi from `~/composables/useApi`

const api = useApi()

export function getBenefits() {
    return api.get(
        '/api/benefit'
      );
}