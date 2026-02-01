const roomRepository = require('../../repositories/room.repository');
const topicRepository = require('../../repositories/topic.repository');
const consumptionTypeRepository = require('../../repositories/consumption-type.repository');
const { getUserId } = require('../../helpers/dataHelpers');
const bookingService = require('../booking.service');
const orderService = require('../order.service');
const moment = require('moment');

class openApiService {

    async optionsRoom(params, site) {
        return await roomRepository.options(params, site) || [];
    }
    async optionsSite(params) {
        return await roomRepository.optionsSite(params) || [];
    }
    async optionsTopic(params) {
        return await topicRepository.options(params) || [];
    }
    async optionsConsumptionType(params) {
        return await consumptionTypeRepository.options(params) || [];
    }

    async createVisitorSubmission(request) {
        const userId = await getUserId(request);
        const { booking, order } = request.body;
        let createdBooking = null;
        if (booking) {
            const startTime = moment(`${booking.date} ${booking.time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
            const endTime = moment(startTime).add(booking.duration, 'hours').format('YYYY-MM-DD HH:mm:ss');
            const getRoomData = await roomRepository.findById(booking.room_id);
            const bookingPayload = {
                body: {
                    room_id: booking.room_id || null,
                    topic_id: booking.topic_id,
                    detail_topic: booking.purpose,
                    purpose: booking.purpose,
                    start_time: startTime,
                    end_time: endTime,
                    notes: booking.notes,
                    cab_id: getRoomData ? getRoomData.cab_id : null,
                },
                user: request.user || { id: userId },
                getUserId: () => userId
            };
            createdBooking = await bookingService.createBooking(bookingPayload);
        }

        if (order) {
            const deliveryTime = moment(`${order.date} ${order.time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
            let maxPax = 0;
            const orderDetails = order.items.map(item => {
                if (item.qty > maxPax) maxPax = item.qty;
                return {
                    consumption_type_id: item.consumption_type_id,
                    menu: item.menu || "Makan Siang Visitor",
                    qty: item.qty,
                    delivery_time: deliveryTime
                };
            });


            const bookingIdRef = createdBooking ? createdBooking.id : null;
            const locationText = order.location_text;

            const orderPayload = {
                body: {
                    cab_id: order.cab_id,
                    location_text: locationText || 'Visitor Area',
                    booking_id: bookingIdRef,
                    pax: maxPax,
                    order_date: order.date,
                    details: orderDetails,
                    status: 'Submit',
                    note: order.notes,
                    purpose: booking?.purpose || order.purpose || 'Visitor Order',
                    cab_id: order.cab_id
                },
                user: request.user || { id: userId },
                getUserId: () => userId
            };

            await orderService.create(orderPayload);
        }

        return {
            success: true,
            booking_id: createdBooking ? createdBooking.id : null,
            message: "Submission berhasil diproses"
        };
    }
}

module.exports = new openApiService();