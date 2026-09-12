const BaseRepository = require('./base.repository');
const Reimbursement = require('../models/Reimbursement');
const ReimbursementDetail = require('../models/ReimbursementDetail');
const ReimbursementAttachment = require('../models/ReimbursementAttachment');
const Approval = require('../models/Approval');

class ReimbursementRepository extends BaseRepository {
    constructor() {
        super(Reimbursement); 
    }

    async findAllWithFiltersUser(queryParams = {}, userId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Reimbursement.query()
            .select('*')
            .withGraphFetched('[requester(selectUsername), department(selectDeptName)]')
            .modifiers({
                selectUsername: builder => builder.select('id_user', 'nama_user'),
                selectDeptName: builder => builder.select('id_dept', 'nama_dept')
            })
            .where('is_active', 1)
            .orderBy('id', 'DESC');

        if (userId) {
            query.where('user_id', userId);
        }

        if (search) {
            query.where(builder => {
                builder.where('document_number', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`)
                    .orWhere('destination', 'like', `%${search}%`);
            });
        }

        query.page(page - 1, per_page);
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
            return this.model.query().findById(id).where('is_active', 1);
        }
        return this.model.query().findById(id).where('is_active', 1).withGraphFetched(relations);
    }

    async createApprovals(payloadArray, trx) {
        if (!payloadArray || payloadArray.length === 0) return;
        for (const payload of payloadArray) {
            payload.module_name = 'REIMBURSEMENT'; 
            await Approval.query(trx).insert(payload);
        }
    }

    async createDetails(payloadArray, trx) {
        if (!payloadArray || payloadArray.length === 0) return;
        for (const payload of payloadArray) {
            await ReimbursementDetail.query(trx).insert(payload);
        }
    }

    async createAttachments(payloadArray, trx) {
        if (!payloadArray || payloadArray.length === 0) return;
        for (const payload of payloadArray) {
            await ReimbursementAttachment.query(trx).insert(payload);
        }
    }

    async getLastRequestByBranchAndMonth(cabId, month, year) {
        return this.model.query()
            .where('cab_id', cabId)
            .whereRaw('MONTH(created_at) = ?', [month])
            .whereRaw('YEAR(created_at) = ?', [year])
            .orderBy('id', 'DESC')
            .first();
    }

    async findPendingApproval(referenceId, userId, roleGaris, cabId) {
        return Approval.query()
            .where('reference_id', referenceId)
            .where('module_name', 'REIMBURSEMENT') // Ubah module name
            .where('status', 'PENDING')
            .andWhere(builder => {
                if (roleGaris === 2) {
                    builder.where(gaBuilder => {
                        gaBuilder.where('approver_type', 'GA_ADMIN')
                            .whereNull('assigned_to')
                            .whereExists(
                                this.model.query()
                                    .whereRaw('reimbursements.id = approvals.reference_id')
                                    .andWhere('reimbursements.cab_id', cabId)
                            );
                    });
                } else {
                    builder.where('assigned_to', userId);
                }
            })
            .first();
    }

    async updateApprovalRecord(approvalId, payload, trx) {
        return Approval.query(trx).patchAndFetchById(approvalId, payload);
    }

    async shiftGaAdminOrder(referenceId, newOrder, trx) {
        return Approval.query(trx)
            .where('reference_id', referenceId)
            .where('module_name', 'REIMBURSEMENT') // Ubah module name
            .where('approver_type', 'GA_ADMIN')
            .patch({ approval_order: newOrder });
    }

    async deleteAttachmentsByRequestId(requestId, trx) {
        return ReimbursementAttachment.query(trx).where('reimbursement_id', requestId).delete();
    }

    async deleteDetailsByRequestId(requestId, trx) {
        return ReimbursementDetail.query(trx).where('reimbursement_id', requestId).delete();
    }

    async findAllWithFilters(queryParams = {}, siteId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = Reimbursement.query()
            .select('*')
            .withGraphFetched('[requester(selectUsername), department(selectDeptName)]')
            .modifiers({
                selectUsername: builder => builder.select('id_user', 'nama_user'),
                selectDeptName: builder => builder.select('id_dept', 'nama_dept')
            })
            .where(builder => {
                // HANYA menampilkan tiket yang masuk ke GA atau sudah CLOSED
                builder.whereIn('status', ['WAITING_GA', 'CLOSED'])
                    .orWhere(subBuilder => {
                        subBuilder.where('status', 'REJECTED')
                            .whereExists(
                                Approval.query()
                                    .whereRaw('approvals.reference_id = reimbursements.id')
                                    .where('approvals.approver_type', 'GA_ADMIN')
                                    .where('approvals.status', 'REJECTED')
                            );
                    });
            })
            .where('is_active', 1)
            .orderBy('id', 'DESC');

        if (siteId) {
            query.where('cab_id', siteId);
        }

        if (search) {
            query.where(builder => {
                builder.where('document_number', 'like', `%${search}%`)
                    .orWhere('purpose', 'like', `%${search}%`);
            });
        }

        query.page(page - 1, per_page);
        const paginatedResult = await query;

        return {
            results: paginatedResult.results,
            total: paginatedResult.total,
            page: page,
            per_page: per_page,
        };
    }
}

module.exports = new ReimbursementRepository();