
export default function useApiBaseUrl() {
    const apiBaseUrl =
        typeof window !== "undefined" && window.location.hostname === "localhost"
            ? "http://localhost:4000"
            : "https://sms-blast-backend.onrender.com";

    return { apiBaseUrl, loading: false, error: null };
}
