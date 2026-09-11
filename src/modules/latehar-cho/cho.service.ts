import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChoDuty } from '../../models/cho-duty.model';
import { User } from '../../models/User';
import { CenterGroup } from '../../models/CenterGroup';
import { Center } from '../../models/Center';
import { StartDutyDto, EndDutyDto } from './dto/cho-duty.dto';
import { Op, QueryTypes, Sequelize } from 'sequelize';
type CenterUserRow = {
    center_id: number;
};

@Injectable()
export class ChoService {
    constructor(
        @InjectModel(ChoDuty)
        private readonly choDutyModel: typeof ChoDuty,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(CenterGroup)
        private readonly centerGroupModel: typeof CenterGroup,
        @InjectModel(Center)
        private readonly centerModel: typeof Center,
    ) { }

    async startDuty(dto: StartDutyDto) {
        try {
            const now = new Date();

            const [center] = await this.choDutyModel.sequelize.query<CenterUserRow>(
                `SELECT center_id FROM "Centerusers" WHERE user_id = :userId LIMIT 1`,
                { replacements: { userId: dto.cho_id }, type: QueryTypes.SELECT },
            );

            if (!center?.center_id) {
                throw new BadRequestException("No center assigned to this user.");
            }

            const centerId = center.center_id;

            const previousActiveDuty = await this.choDutyModel.findOne({
                where: { cho_id: dto.cho_id, end_time: null },
            });

            if (previousActiveDuty) {
                previousActiveDuty.end_time = now;
                await previousActiveDuty.save();
            }

            const newDuty = await this.choDutyModel.create({
                cho_id: dto.cho_id,
                start_time: now,
                center_id: centerId,
            });

            return {
                success: true,
                message: previousActiveDuty
                    ? "Previous duty auto-closed. New duty started."
                    : "Duty started successfully.",
                duty: newDuty,
            };

        } catch (error) {
            throw new InternalServerErrorException(
                `Failed to start duty: ${error.message}`
            );
        }
    }



    async endDuty(dto: EndDutyDto) {
        try {
            const now = new Date();
            const activeDuty = await this.choDutyModel.findOne({
                where: { cho_id: dto.cho_id, end_time: null },
                order: [['start_time', 'DESC']],
            });

            if (!activeDuty) {
                throw new BadRequestException('No active duty found to end.');
            }

            activeDuty.end_time = now;
            await activeDuty.save();

            return {
                success: true,
                message: 'Duty ended successfully.',
                duty: activeDuty,
            };

        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException(`Failed to end duty: ${error.message}`);
        }
    }
    async getDutyStatus(cho_id: number) {
        try {
            const now = new Date();

            const startOfDay = new Date(now);
            startOfDay.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date(now);
            endOfDay.setUTCHours(23, 59, 59, 999);
            const todayActiveDuty = await this.choDutyModel.findOne({
                where: {
                    cho_id,
                    end_time: null,
                    start_time: {
                        [Op.between]: [startOfDay, endOfDay],
                    },
                },
                order: [['start_time', 'DESC']],
            });
            const staleOpenDuty = await this.choDutyModel.findOne({
                where: {
                    cho_id,
                    end_time: null,
                    start_time: {
                        [Op.lt]: startOfDay,
                    },
                },
                order: [['start_time', 'ASC']],
            });

            return {
                active: Boolean(todayActiveDuty),
                staleOpen: Boolean(staleOpenDuty),

                todayDuty: todayActiveDuty
                    ? {
                        id: todayActiveDuty.id,
                        start_time: todayActiveDuty.start_time,
                    }
                    : null,

                staleDuty: staleOpenDuty
                    ? {
                        id: staleOpenDuty.id,
                        start_time: staleOpenDuty.start_time,
                    }
                    : null,
            };
        } catch (err) {
            throw new InternalServerErrorException(
                `Failed to fetch duty status: ${err.message}`,
            );
        }
    }

    // async getCenterLogs(
    //     cho_id: number,
    //     startDate?: string,
    //     endDate?: string
    // ) {
    //     try {
    //         // Require both startDate and endDate if either is provided
    //         if ((startDate && !endDate) || (!startDate && endDate)) {
    //             throw new BadRequestException(
    //                 'Both startDate and endDate must be provided together, or neither provided (defaults to today).'
    //             );
    //         }

    //         const replacements: any = { userId: cho_id };
    //         let dateFilter = "";

    //         // If start and end dates are provided, filter by those dates
    //         // Otherwise, fetch all tuples for today
    //         if (startDate && endDate) {
    //             dateFilter = `AND cd.start_time BETWEEN :startDate AND :endDate`;
    //             replacements.startDate = startDate;
    //             replacements.endDate = endDate;
    //         } else {
    //             const now = new Date();
    //             const startOfDay = new Date(now);
    //             startOfDay.setUTCHours(0, 0, 0, 0);

    //             const endOfDay = new Date(now);
    //             endOfDay.setUTCHours(23, 59, 59, 999);

    //             dateFilter = `AND cd.start_time BETWEEN :startDate AND :endDate`;
    //             replacements.startDate = startOfDay.toISOString();
    //             replacements.endDate = endOfDay.toISOString();
    //         }

    //         const result = await this.choDutyModel.sequelize.query(
    //             `
    //   SELECT 
    //       c.id AS center_id,
    //       c.agency_name || '(' || c.agency_district || ')' AS agency_full_name,
    //       cd.start_time,
    //       cd.end_time,
    //       cd.created_at
    //   FROM "cho_duty" cd
    //   JOIN "Centers" c 
    //       ON cd.center_id = c.id
    //   WHERE cd.center_id IN (
    //       SELECT DISTINCT (value::text)::INT
    //       FROM "center_groups" cg,
    //       jsonb_array_elements(cg.center_ids) AS value
    //       WHERE cg.id IN (
    //           SELECT (jsonb_array_elements(attributes->'center_groups')->>'id')::INT
    //           FROM "Users"
    //           WHERE id = :userId
    //       )
    //       AND cg.is_active = true
    //   )
    //   ${dateFilter}
    //   ORDER BY cd.start_time DESC
    //   `,
    //             {
    //                 replacements,
    //                 type: QueryTypes.SELECT,
    //             }
    //         );

    //         return result;
    //     } catch (err) {
    //         throw new InternalServerErrorException(
    //             `Failed to fetch center logs: ${err.message}`
    //         );
    //     }
    // }

    /**
     * Get center logs updated - fetches cho_duty records based on center groups from user attributes
     * @param cho_id - User ID to search for
     * @param startDate - Optional start date in ISO format
     * @param endDate - Optional end date in ISO format
     * @returns Array of cho_duty records
     */
    async getCenterLogs(
        cho_id: number,
        startDate?: string,
        endDate?: string
    ) {
        try {
            const user = await this.userModel.findByPk(cho_id);
            if (!user) {
                throw new NotFoundException(`User with id ${cho_id} not found.`);
            }

            const attributes = user.attributes || {};
            const centerGroups = attributes.center_groups;

            if (!centerGroups || !Array.isArray(centerGroups) || centerGroups.length === 0) {
                throw new BadRequestException(
                    `User with id ${cho_id} has no center_groups in attributes.`
                );
            }

            const groupIds = centerGroups
                .map((group: any) => group?.id)
                .filter((id: any) => id !== undefined && id !== null);

            if (groupIds.length === 0) {
                throw new BadRequestException(
                    `User with id ${cho_id} has no valid center group ids.`
                );
            }

            const centerGroupsRecords = await this.centerGroupModel.findAll({
                where: {
                    id: {
                        [Op.in]: groupIds,
                    },
                    is_active: true,
                },
            });

            if (centerGroupsRecords.length === 0) {
                throw new NotFoundException(
                    `No active center groups found for the provided group ids.`
                );
            }

            const allCenterIds = new Set<number>();
            centerGroupsRecords.forEach((group) => {
                const centerIds = group.center_ids || [];
                centerIds.forEach((centerId: string | number) => {
                    const id = typeof centerId === 'string' ? parseInt(centerId, 10) : centerId;
                    if (!isNaN(id)) {
                        allCenterIds.add(id);
                    }
                });
            });

            if (allCenterIds.size === 0) {
                throw new NotFoundException(
                    `No center ids found in the center groups.`
                );
            }

            const centerIdsArray = Array.from(allCenterIds);
            const whereConditions: any = {
                center_id: {
                    [Op.in]: centerIdsArray,
                },
            };

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                whereConditions[Op.or] = [
                    {
                        start_time: {
                            [Op.between]: [start, end],
                        },
                    },
                    {
                        end_time: {
                            [Op.between]: [start, end],
                        },
                    },
                    {
                        [Op.and]: [
                            {
                                start_time: {
                                    [Op.lte]: start,
                                },
                            },
                            {
                                end_time: {
                                    [Op.gte]: end,
                                },
                            },
                        ],
                    },
                ];
            } else {
                const now = new Date();
                const startOfDay = new Date(now);
                startOfDay.setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(now);
                endOfDay.setUTCHours(23, 59, 59, 999);
                whereConditions[Op.or] = [
                    {
                        start_time: {
                            [Op.between]: [startOfDay, endOfDay],
                        },
                    },
                    {
                        end_time: {
                            [Op.between]: [startOfDay, endOfDay],
                        },
                    },
                    {
                        [Op.and]: [
                            {
                                start_time: {
                                    [Op.lte]: startOfDay,
                                },
                            },
                            {
                                end_time: {
                                    [Op.gte]: endOfDay,
                                },
                            },
                        ],
                    },
                ];
            }

            const choDutyRecords = await this.choDutyModel.findAll({
                where: whereConditions,
                order: [['start_time', 'DESC']],
            });

            const uniqueCenterIds = Array.from(new Set(choDutyRecords.map((record) => record.center_id).filter(Boolean)));
            const centersMap = new Map<number, Center>();
            
            if (uniqueCenterIds.length > 0) {
                const centers = await this.centerModel.findAll({
                    where: {
                        id: {
                            [Op.in]: uniqueCenterIds,
                        },
                    },
                    attributes: ['id', 'project_name', 'agency_name'],
                });
                centers.forEach((center) => {
                    centersMap.set(center.id, center);
                });
            }

            const result = choDutyRecords.map((duty) => {
                const dutyData = duty.toJSON();
                const center = duty.center_id ? centersMap.get(duty.center_id) : null;
                return {
                    ...dutyData,
                    center_name: center?.project_name || null,
                };
            });

            return result;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }
            throw new InternalServerErrorException(
                `Failed to fetch center logs updated: ${err.message}`
            );
        }
    }




}
