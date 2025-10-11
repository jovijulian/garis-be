const { BaseModelBooking } = require('../../config/database');

class OrderDetail extends BaseModelBooking {
    static get tableName() {
        return 'order_details';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['order_id', 'consumption_type_id', 'menu', 'qty', 'delivery_time'],
            properties: {
                id: { type: 'integer' },
                order_id: { type: 'integer' },
                consumption_type_id: { type: 'integer' },
                menu: { type: 'string' },
                qty: { type: 'integer' },
                delivery_time: { type: 'string', format: 'date-time' },
            }
        };
    }

    static get relationMappings() {
        const Order = require('./Order');
        const ConsumptionType = require('./ConsumptionType');

        return {
            order: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: Order,
                join: {
                    from: 'order_details.order_id',
                    to: 'orders.id'
                }
            },
            consumption_type: {
                relation: BaseModelBooking.BelongsToOneRelation,
                modelClass: ConsumptionType,
                join: {
                    from: 'order_details.consumption_type_id',
                    to: 'consumption_types.id'
                }
            }
        };
    }

    $formatJson(json) {
        json = super.$formatJson(json);
        return json;
    }
}

module.exports = OrderDetail;