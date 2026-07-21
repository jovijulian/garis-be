const BaseRepository = require('./base.repository');
const Jabatan = require('../models/Jabatan');

class JabatanRepository extends BaseRepository {
    constructor() {
        super(Jabatan);
    }

    async findByKode(kode) {
        return Jabatan.query().where('kode', kode).first();
    }
}

module.exports = new JabatanRepository();