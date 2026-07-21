const { BaseModelHr } = require('../../config/database');

class Jabatan extends BaseModelHr {
    static get tableName() {
        return 'tb_jab';
    }

    static get idColumn() {
        return 'id_jab';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [],
            properties: {
                id_jab: { type: 'integer' },
                nama_jab: { type: 'string', minLength: 1, maxLength: 255 },
                kode: { type: 'string' },
            }
        };
    }



    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Jabatan;