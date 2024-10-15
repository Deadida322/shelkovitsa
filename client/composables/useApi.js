import axios from 'axios';

let axiosNuxt;

export default function useApi() {
    const config = useRuntimeConfig();

    if (!axiosNuxt) {
        axiosNuxt = axios.create({
            baseURL: config.baseURL
        });
    }

    return axiosNuxt;
}
