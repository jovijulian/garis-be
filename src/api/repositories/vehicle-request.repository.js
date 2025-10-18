const BaseRepository = require('./base.repository');
const VehicleRequest = require('../models/VehicleRequest');
const moment = require('moment');
class VehicleRequestRepository extends BaseRepository {
    constructor() {
        super(VehicleRequest);
    }

    async findAllWithFilters(queryParams = {}, siteId = null) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = VehicleRequest.query()
            .select('*')
            .withGraphFetched('[cabang, user, vehicle_type, detail.[vehicle, driver]]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('vehicle_type', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('detail.vehicle', builder => {
                builder.select('id', 'license_plate', 'name');
            })
            .modifyGraph('detail.driver', builder => {
                builder.select('id', 'name', 'phone_number');
            })

            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('destination', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)
                    .orWhereExists(
                        VehicleRequest.relatedQuery('vehicle_type')
                            .where('name', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        VehicleRequest.relatedQuery('detail.vehicle')
                            .where('name', 'like', `%${search}%`)
                            .orWhere('license_plate', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        VehicleRequest.relatedQuery('detail.driver')
                            .where('name', 'like', `%${search}%`)
                            .orWhere('phone_number', 'like', `%${search}%`)
                    );
            });

        }

        if (siteId) {
            query.where('cab_id', siteId);
        }

        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }

    async findAllWithFiltersByUserId(queryParams = {}, userId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = VehicleRequest.query()
            .select('*')
            .withGraphFetched('[cabang, user, vehicle_type, assigned_vehicles.[vehicle], assigned_drivers.[driver]]')
            .modifyGraph('cabang', builder => {
                builder.select('id_cab', 'nama_cab');
            })
            .modifyGraph('user', builder => {
                builder.select('id_user', 'nama_user');
            })
            .modifyGraph('vehicle_type', builder => {
                builder.select('id', 'name');
            })
            .modifyGraph('assigned_vehicles.vehicle', builder => {
                builder.select('id', 'license_plate', 'name');
            })
            .modifyGraph('assigned_drivers.driver', builder => {
                builder.select('id', 'name', 'phone_number');
            })
            .where('id_user', userId)
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (search) {
            query.where(builder => {
                builder.where('destination', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)
                    .orWhereExists(
                        VehicleRequest.relatedQuery('vehicle_type')
                            .where('name', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        VehicleRequest.relatedQuery('assigned_vehicles.vehicle')
                            .where('name', 'like', `%${search}%`)
                            .orWhere('license_plate', 'like', `%${search}%`)
                    )
                    .orWhereExists(
                        VehicleRequest.relatedQuery('assigned_drivers.driver')
                            .where('name', 'like', `%${search}%`)
                            .orWhere('phone_number', 'like', `%${search}%`)
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


    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return VehicleRequest.query().findById(id).withGraphFetched(relations);
    }


}

module.exports = new VehicleRequestRepository();