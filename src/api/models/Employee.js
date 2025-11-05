const { BaseModelHr } = require('../../config/database');

class Employee extends BaseModelHr {
    static get tableName() {
        return 'tb_karyawan';
    }

    static get idColumn() {
        return 'id_karyawan';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [],
            properties: {
                id_karyawan: { type: 'string' },
                nik: { type: 'string', minLength: 1, maxLength: 255 },
                no_ktp: { type: 'string', minLength: 1, maxLength: 255 },
                nama: { type: 'string', },
                email: { type: 'string', format: 'email' },
            }
        };
    }

   

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Employee;