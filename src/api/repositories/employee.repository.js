const BaseRepository = require('./base.repository');
const Employee = require('../models/Employee');

class EmployeeRepository extends BaseRepository {
    constructor() {
        super(Employee);
    }

    async findByUserId(userId) {
        return Employee.query().where('nik', userId)
            .first();
    }

    async findByJabatanId(idJabatan) {
        return Employee.query().where('id_jab', idJabatan).first();
    }

}

module.exports = new EmployeeRepository();