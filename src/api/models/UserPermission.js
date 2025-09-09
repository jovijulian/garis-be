const { BaseModelHr } = require('../../config/database');

class UserPermission extends BaseModelHr {
    static get tableName() {
        return 'tb_user_permissions_garis';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['user_id', 'cab_id', 'role_name'],
            properties: {
                id: { type: 'integer' },
                user_id: { type: 'string' },
                cab_id: { type: 'integer' },
                role_name: { type: 'string' },
            }
        };
    }

    static get relationMappings() {
        const User = require('./User');
        const Site = require('./Site');

        return {
            user: {
                relation: BaseModelHr.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'tb_user_permissions_garis.user_id',
                    to: 'users.id_user',
                },
            },
            site: {
                relation: BaseModelHr.BelongsToOneRelation,
                modelClass: Site,
                join: {
                    from: 'tb_user_permissions_garis.cab_id',
                    to: 'tb_cab.id_cab',
                },
            },
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = UserPermission;