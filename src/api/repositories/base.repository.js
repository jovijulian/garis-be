
class BaseRepository {
    constructor(model) {
        if (!model) {
            throw new Error('A model must be provided to the repository.');
        }
        this.model = model;
    }

    async create(data, trx = null) {
        const query = this.model.query(trx);
        return query.insert(data);
    }

    async findById(id, trx = null) {
        return this.model.query(trx).findById(id);
    }

    async findAll(trx = null) {
        return this.model.query(trx).select();
    }

    async update(id, data, trx = null) {
        return this.model.query(trx).patchAndFetchById(id, data);
    }

    async delete(id, trx = null) {
        const rowsDeleted = await this.model.query(trx).deleteById(id);
        return rowsDeleted > 0;
    }
}

module.exports = BaseRepository;