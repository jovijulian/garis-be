const Site = require('../models/Site')
const User = require('../models/User');
const UserPermission = require('../models/UserPermission');

class UserAccessRepository {


    async findAllWithPermissions(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = User.query()
            .select('tb_user.id_user', 'tb_user.nama_user',  'tb_user.role_garis')
            .withGraphFetched('permissions.[site(selectSiteName)]')
            .modifiers({
                selectSiteName(builder) {
                    builder.select('id_cab', 'nama_cab');
                }
            })
            .page(page - 1, per_page)
            .orderBy('tb_user.nama_user', 'ASC');

        if (search) {
            query.where(builder => {
                builder.where('tb_user.nama_user', 'like', `%${search}%`)
                    .orWhereExists(
                        User.relatedQuery('permissions')
                            .joinRelated('site')
                            .where('site.nama_cab', 'like', `%${search}%`)
                    );
            });
        }
        const paginatedResult = await query;
        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }


    async findAllSites(params) {
        const query = Site.query().select('id_cab', 'nama_cab').orderBy('nama_cab', 'ASC');

        if (params) {
            query.where('nama_cab', 'like', `%${params}%`);
        }

        const data = await query;

        return data;
    }


    async updateUserRole(userId, roleGaris, trx) {
        return User.query(trx).update({ role_garis: roleGaris }).where('id_user', userId);
    }


    async clearSitePermissions(userId, trx) {
        return UserPermission.query(trx).where('user_id', userId).delete();
    }


    async addSitePermissions(userId, siteIds, roleName, trx) {
        if (!siteIds || siteIds.length === 0) {
            return;
        }
        const permissionsToInsert = {
            user_id: userId,
            cab_id: siteIds,
            role_name: roleName,
        };
        return UserPermission.query(trx).insert(permissionsToInsert);
    }
}

module.exports = new UserAccessRepository();