const { BaseModelHr } = require('../../config/database');

class Site extends BaseModelHr {
    static get tableName() {
        return 'tb_cab';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['nama_cab'],
            properties: {
                no_cab: { type: 'integer' },
                nama_cab: { type: 'string' },
                id_cab: { type: 'integer' },
            }
        };
    }

    static get relationMappings() {
        const UserPermission = require('./UserPermission');
        return {
            permissions: {
                relation: BaseModelHr.HasManyRelation,
                modelClass: UserPermission,
                join: {
                    from: 'tb_cab.id_cab',
                    to: 'tb_user_permissions_garis.cab_id'
                }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = Site;