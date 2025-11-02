const userAccessRepository = require('../repositories/user-access.repository');
const { knexHr } = require('../../config/database');

class UserAccessService {

    async getAll(queryParams) {
        const paginatedResult = await userAccessRepository.findAllWithPermissions(queryParams);
        
        const allUsers = paginatedResult.results;

        const formattedUsers = allUsers.map(user => {
            const permissions = user.permissions || [];
            
            const siteAccess = permissions
                .filter(p => p && p.site) 
                .map(p => ({
                    id: p.site.id_cab,
                    name: p.site.nama_cab,
                    role_name: p.role_name
                }));

            delete user.permissions;

            return { ...user, site_access: siteAccess, email: user.email || '' };
        });

        return {
            data: formattedUsers,
            pagination: {
                total: paginatedResult.total,
                page: paginatedResult.page,
                per_page: paginatedResult.per_page,
                total_pages: Math.ceil(paginatedResult.total / paginatedResult.per_page)
            }
        };
    }

    async getAllSites(params) {
        return userAccessRepository.findAllSites(params);
    }

    async updateUserAccess(userId, data) {
        console.log(userId)
        const { role_garis, sites, role_name } = data;

        if (!role_garis) {
            const error = new Error('Base role (role_garis) is required.');
            error.statusCode = 400;
            throw error;
        }

        return knexHr.transaction(async (trx) => {
            await userAccessRepository.updateUserRole(userId, role_garis, trx);

            await userAccessRepository.clearSitePermissions(userId, trx);

            if (role_garis === 2 && sites ) {
                await userAccessRepository.addSitePermissions(userId, sites, role_name, trx);
            }

            return { message: 'User access updated successfully.' };
        });
    }
}

module.exports = new UserAccessService();