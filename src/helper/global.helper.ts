import * as bcrypt from 'bcryptjs';
import { Transaction } from 'sequelize';

import { User } from 'src/models/User';
import { Cetuser } from 'src/models/CetUser';
import { CenterUser } from 'src/models/CenterUser';
import { UserLog } from 'src/models/userlog.model';

export interface CreateUserLogDto {
  user_id: number;
  action_type: string;
  action_description?: any;
  user_ip?: string;
  action_time?: Date;
}

export class GlobalHelper {
  /* ===================== USER LOGS ===================== */

  static async createUserLogs(
    data: CreateUserLogDto,
    transaction?: Transaction,
  ): Promise<UserLog> {
    return UserLog.create(
      {
        user_id: data.user_id,
        action_type: data.action_type,
        action_description: data.action_description,
        user_ip: data.user_ip,
        action_time: data.action_time,
      },
      transaction ? { transaction } : undefined,
    );
  }

  /* ===================== CENTER / CET ===================== */

  static async getCenterId(userId: number) {
    return CenterUser.findOne({
      where: { user_id: userId },
      raw: true,
      nest: true,
    });
  }

  static async getCetId(userId: number) {
    return Cetuser.findOne({
      where: { user_id: userId },
      raw: true,
      nest: true,
    });
  }

  // /* ===================== ASSIGN CET TO USER ===================== */

  // static async assignCetToUser(
  //   params: {
  //     username: string;
  //     name: string;
  //     phone: string | number;
  //     email: string;
  //     password: string;
  //     cet_id: number;
  //     role_id: number;
  //     permission_id: number;
  //   },
  //   transaction: Transaction, // 👈 REQUIRED from caller
  // ) {
  //   const {
  //     username,
  //     name,
  //     phone,
  //     email,
  //     password,
  //     cet_id,
  //     role_id,
  //     permission_id,
  //   } = params;

  //   const hashedPassword = await bcrypt.hash(password, 8);

  //   const userInsert = await User.create(
  //     {
  //       username: username.trim().toLowerCase(),
  //       name,
  //       phone: String(phone),
  //       email: email.toLowerCase(),
  //       role_id,
  //       permission_id,
  //       status: true,
  //       isAdmin: false,
  //       password: hashedPassword,
  //     },
  //     { transaction },
  //   );

  //   const userCet = await Cetuser.create(
  //     {
  //       user_id: userInsert.id,
  //       cet_id,
  //     },
  //     { transaction },
  //   );

  //   return {
  //     user: userInsert,
  //     cetMapping: userCet,
  //   };
  // }
   static assignCetToUser = async (req, res, getData) => {
  try {
    const { username, name, phone, email, password, cet_id } = req.body;
    const phoneNumber = String(phone);

    const data: Record<string, unknown> = {
      username: username.trim().toLowerCase(),
      name,
      phone: phoneNumber,
      email: email.toLowerCase(),
      role_id: getData.role_id,
      status: true,
      isAdmin: false,
      password: bcrypt.hashSync(password, 8),
    };

    if (getData.id != null) {
      data.permission_id = getData.id;
    } else {
      data.permission_id = null;
    }

    const userInsert = await User.create(data as any);

    const userData = await Cetuser.create({
      user_id: userInsert.id,
      cet_id: cet_id,
    });

    return { userData, userInsert };
  } catch (error) {
    throw error; // important: preserve stack trace
  }
};

static isLmcAdmin = (user) => {
  return user?.role === "LMC_ADMIN";
};
}
