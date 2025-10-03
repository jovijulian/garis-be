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

function getUserId(request) {
    if (!request.user || !request.user.id_user) {
        throw new Error("User ID not found in request user.");
    }
    return request.user.id_user;
}
function parseMenuDescription(menuDescription) {
    if (!menuDescription || typeof menuDescription !== 'string') {
        return [];
    }

    return menuDescription
        .split('\n')
        .flatMap(line => line.split(','))
        .map(item =>
            item
                .trim()
                .replace(/^(\d+\.|-|\*)\s*/, '')
        )
        .filter(item => item.length > 0);
}

function getRoleUser(request) {
    if (!request.user || !request.user.id_user) {
        throw new Error("User ID not found in request user.");
    }
    return request.user.role;
}

module.exports = { formatDateTime, formatRupiah, getUserId, parseMenuDescription, getRoleUser };
