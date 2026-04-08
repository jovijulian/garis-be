const BaseRepository = require('./base.repository');
const InventoryItem = require('../models/InventoryItem');

class InventoryItemRepository extends BaseRepository {
    constructor() {
        super(InventoryItem);
    }

    async findAllWithFilters(queryParams = {}) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';
        const cab_id = queryParams.cab_id;

        const query = InventoryItem.query()
            .select('*')
            .where('is_active', 1)
            .withGraphFetched('[category(selectName), base_unit(selectName), pack_unit(selectName)]')
            .modifiers({
                selectName: (builder) => {
                    builder.select('id', 'name');
                }
            })
            .page(page - 1, per_page)
            .orderBy('id', 'DESC');

        if (cab_id) {
            query.where('cab_id', cab_id);
        }

        if (search) {
            query.where(builder => {
                builder.where('name', 'like', `%${search}%`)
                    .orWhere('barcode', 'like', `%${search}%`);
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

    async findByBarcodeAndCabang(barcode, cab_id) {
        return InventoryItem.query()
            .where('barcode', barcode)
            .where('cab_id', cab_id)
            .where('is_active', 1)
            .first();
    }

    async findByBarcodeAndCabangWithRelations(barcode, cab_id) {
        return InventoryItem.query()
            .where('barcode', barcode)
            .where('cab_id', cab_id)
            .where('is_active', 1)
            .withGraphFetched('[category(selectName), base_unit(selectName), pack_unit(selectName)]')
            .modifiers({
                selectName: (builder) => builder.select('id', 'name')
            })
            .first();
    }

    async findByIdWithRelations(id, relations) {
        if (!relations) {
            return this.findById(id);
        }
        return InventoryItem.query().findById(id).withGraphFetched(relations);
    }

    async options(cabId, search = '') {
        const query = this.model.query()
            .select('id', 'name', 'barcode', 'stock_available', 'base_unit_id')
            .withGraphFetched('[base_unit]')
            .modifyGraph('base_unit', builder => {
                builder.select('id', 'name');
            })
            .where('is_active', 1)
            .orderBy('name', 'ASC');

        if (cabId) {
            query.where('cab_id', cabId);
        }

        if (search) {
            query.where(builder => {
                builder.where('name', 'like', `%${search}%`)
                    .orWhere('barcode', 'like', `%${search}%`);
            });
        }

        return await query;
    }
}

module.exports = new InventoryItemRepository();