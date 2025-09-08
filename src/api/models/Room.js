// const { Model } = require('../../config/database');

// class Room extends Model {
//     static get tableName() {
//         return 'rooms';
//     }

//     static get jsonSchema() {
//         return {
//             type: 'object',
//             required: ['name'],
//             properties: {
//                 id: { type: 'integer' },
//                 name: { type: 'string' },
//                 description: { type: 'string' },
//             }
//         };
//     }

//     $formatJson(json) {
//         json = super.$formatJson(json);
//         return json;
//     }
// }

// module.exports = Room;