const moment = require("moment");
require("moment/locale/id");

function formatDateTime(date = null) {
    if (!date) {
        date = new Date();
    }
    return moment(date).locale("id").format("YYYY-MM-DD HH:mm:ss");
}

function formatRupiah(amount = number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

module.exports = { formatDateTime, formatRupiah };
