export const Defaults = {
    id: "httpService",
    validateStatus: function (status) {
        return status >= 200 && status < 400;
    },
    retryDelay: 100
}
