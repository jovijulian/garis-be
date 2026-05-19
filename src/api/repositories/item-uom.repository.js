const BaseRepository = require('./base.repository');
const ItemUom = require('../models/ItemUom');

class ItemUomRepository extends BaseRepository {
    constructor() {
        super(ItemUom);
    }

    async createItemUom(payload) {
        return await ItemUom.query().insert(payload);
    }

    async deleteByItemId(itemId) {
        return await ItemUom.query().delete().where('item_id', itemId);
    }
}

module.exports = new ItemUomRepository();