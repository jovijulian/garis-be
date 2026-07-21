const BaseRepository = require('./base.repository');
const ProjectRequest = require('../models/ProjectRequest');
const Approval = require('../models/Approval');
const ProjectAttachment = require('../models/ProjectAttachment');
const ProjectProgress = require('../models/ProjectProgress');

class ProjectRequestRepository extends BaseRepository {
    constructor() {
        super(ProjectRequest);
    }

    async findAllWithFiltersUser(queryParams = {}, userId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = ProjectRequest.query()
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
                    .orWhere('problem_description', 'like', `%${search}%`);
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
            payload.module_name = 'PROJECT_REQUEST';
            await Approval.query(trx).insert(payload);
        }
    }

    async createAttachments(payloadArray, trx) {
        if (!payloadArray || payloadArray.length === 0) return;
        for (const payload of payloadArray) {
            await ProjectAttachment.query(trx).insert(payload);
        }
    }

    async getLastRequestByBranchAndMonth(cabId, month, year) {
        return this.model.query()
            .where('cab_id', cabId)
            .whereRaw('MONTH(request_date) = ?', [month])
            .whereRaw('YEAR(request_date) = ?', [year])
            .orderBy('id', 'DESC')
            .first();
    }

    async findPendingApproval(referenceId, userId, roleGaris, cabId) {
        return Approval.query()
            .where('reference_id', referenceId)
            .where('module_name', 'PROJECT_REQUEST')
            .where('status', 'PENDING')
            .andWhere(builder => {
                builder.where('assigned_to', userId);

                if (roleGaris === 2) {
                    builder.orWhere(gaBuilder => {
                        gaBuilder.where('approver_type', 'GA_ADMIN')
                                 .whereNull('assigned_to')
                                 .whereExists(
                                     this.model.query() 
                                         .whereRaw('project_requests.id = approvals.reference_id')
                                         .andWhere('project_requests.cab_id', cabId)
                                 );
                    });
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
            .where('module_name', 'PROJECT_REQUEST')
            .where('approver_type', 'GA_ADMIN')
            .patch({ approval_order: newOrder });
    }

    async deleteAttachmentsByRequestId(requestId, trx) {
        return ProjectAttachment.query(trx).where('request_id', requestId).delete();
    }

    async findAllWithFilters(queryParams = {}, siteId) {
        const page = queryParams.page || 1;
        const per_page = queryParams.per_page || 20;
        const search = queryParams.search || '';

        const query = ProjectRequest.query()
            .select('*')
            .withGraphFetched('[requester(selectUsername), department(selectDeptName)]')
            .modifiers({
                selectUsername: builder => builder.select('id_user', 'nama_user'),
                selectDeptName: builder => builder.select('id_dept', 'nama_dept')
            })
            .where(builder => {
                builder.whereIn('status', ['WAITING_GA', 'IN_PROGRESS', 'WAITING_VERIFICATION', 'REVISION', 'CLOSED'])
                       .orWhere(subBuilder => {
                           subBuilder.where('status', 'REJECTED')
                                     .whereExists(
                                         Approval.query()
                                             .whereRaw('approvals.reference_id = project_requests.id')
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
                    .orWhere('problem_description', 'like', `%${search}%`);
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

    async createProgress(payload, trx) {
        return ProjectProgress.query(trx).insertAndFetch(payload);
    }

}

module.exports = new ProjectRequestRepository();