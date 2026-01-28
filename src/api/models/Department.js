const { BaseModelHr } = require('../../config/database');

class Department extends BaseModelHr {
    static get tableName() {
        return 'tb_dept';
    }

    static get idColumn() {
        return 'id_dept';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [],
            properties: {
                id_dept: { type: 'integer' },
                nama_dept: { type: 'string', minLength: 1, maxLength: 255 },
                no_dept: { type: 'integer' },
            }
        };
    }



    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Department;