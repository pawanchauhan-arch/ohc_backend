import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import { User } from 'src/models/User';
import { UserLog as userlog } from 'src/models/userlog.model';
import { Cetuser as Cetuser } from 'src/models/CetUser';
import { Permission } from 'src/models/Permissions';
import { Role } from 'src/models/Role';
import {
  JWT_ADMIN as configJwttoken,
  JWT_CENTER as configJwttokenCenter,
} from 'config/envConfig';
import { Op } from 'sequelize';

/**
 * ADMIN LOGIN
 */
type TokenResponse = {
  token?: string;
  role?: any;
  username?: any;
  isAdmin?: any;
  permission?: any;
  user_id?: any;
  status?: any;
  cet_id?: any;
  isCet?: any;
};

export const checkUserPass = async (
  password: string,
  userdata: any,
  res: any,
): Promise<TokenResponse> => {
  const passwordIsValid = await bcrypt.compare(password, userdata.password);

  if (!passwordIsValid) {
    return { status: 'invalid_password' };
  }

  const token = jwt.sign({ data: { id: userdata.id } }, configJwttoken, {
    expiresIn: '10d',
  });

  res.setHeader(
    'Set-Cookie',
    cookie.serialize('token', token, {
      maxAge: 10 * 24 * 60 * 60,
      httpOnly: true,
    }),
  );

  return {
    token,
    role: userdata.slug,
    username: userdata.username,
    isAdmin: userdata.isAdmin,
    permission: userdata.permission || null,
    user_id: userdata.id || null,
    status: true,
  };
};

/**
 * CENTER LOGIN
 */
export const checkUserPassCenter = async (
  password: string,
  userdata: any,
  res: any,
): Promise<TokenResponse> => {
  try {
    const passwordIsValid = await bcrypt.compare(password, userdata.password);

    if (!passwordIsValid) {
      return { status: 'invalid_password' };
    }

    const token = jwt.sign(
      { data: { id: userdata.id } },
      configJwttokenCenter,
      { expiresIn: '10d' },
    );

    const response = {
      token,
      role: userdata.slug,
      username: userdata.username,
      isAdmin: userdata.isAdmin,
      permission: userdata.permission || null,
      user_id: userdata.id,
      status: true,
    };

    res.setHeader(
      'Set-Cookie',
      cookie.serialize('center_token', token, {
        maxAge: 10 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      }),
    );

    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * EMAIL EXIST CHECK
 */
export const checkEmailExist = async (email: string) => {
  try {
    const exists = await User.findOne({ where: { email } });
    return !!exists;
  } catch (error) {
    throw error;
  }
};

/**
 * USERNAME EXIST CHECK
 */
export const checkUserNameExist = async (username: string) => {
  try {
    const exists = await User.findOne({ where: { username } });
    return !!exists;
  } catch (error) {
    throw error;
  }
};

/**
 * PHONE EXIST CHECK
 */
export const checkPhoneExist = async (phone: string) => {
  try {
    const exists = await User.findOne({ where: { phone } });
    return !!exists;
  } catch (error) {
    throw error;
  }
};

/**
 * CET LOGIN
 */
export const checkUserPassCet = async (
  password: string,
  userdata: any,
  res: any,
): Promise<TokenResponse> => {
  try {
    const passwordIsValid = await bcrypt.compare(password, userdata.password);

    if (!passwordIsValid) {
      return { status: 'invalid_password' };
    }

    const cetUser = await Cetuser.findOne({
      where: { user_id: userdata.id },
    });

    if (!cetUser) {
      return { status: 'no_cet_id_found' };
    }

    const token = jwt.sign(
      {
        data: {
          id: userdata.id,
          cet_id: cetUser.cet_id,
        },
      },
      configJwttokenCenter,
      { expiresIn: '1000d' },
    );

    const response = {
      token,
      role: userdata.slug,
      username: userdata.username,
      isAdmin: false,
      permission: userdata.permission || null,
      cet_id: cetUser.cet_id,
      isCet: true,
      status: true,
    };

    res.setHeader(
      'Set-Cookie',
      cookie.serialize('cet_token', token, {
        maxAge: 10 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      }),
    );

    return response;
  } catch (error) {
    throw error;
  }
};

export const createUserLogs = async (data: {
  user_id: any;
  action_type: any;
  action_description: any;
  user_ip?: any;
  action_time?: any;
}) => {
  try {
    await userlog.create({
      user_id: data.user_id,
      action_type: data.action_type,
      action_description: data.action_description,
      user_ip: data.user_ip,
      action_time: data.action_time || new Date(),
    });
  } catch (error) {
    throw error.message;
  }
};

export const checkRole = async (permission_id: any) => {
  try {
    return await Permission.findOne({
      where: { id: permission_id },
      raw: true,
      nest: true,
    });
  } catch (error) {
    throw new Error(error);
  }
};
export const getRole = async (slug: any) => {
  try {
    return await Role.findOne({
      where: { slug: slug },

      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const getRoleById = async (role_id: number | string) => {
  try {
    return await Role.findOne({
      where: { id: role_id },
      raw: true,
      nest: true,
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const getLastId = async (getRole: any) => {
  try {
    return await User.findOne({
      where: { role_id: getRole.id },
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const createUser = async (data: any) => {
  try {
    return await User.create(data);
  } catch (error) {
    throw new Error(error);
  }
};
// export const getCenterId = async (id: number) => {
//   try {
//     return await Centeruser.findOne({ where: { user_id: id }, raw: true, nest: true });
//   } catch (error) {
//     throw error;
//   }
// };

// export const getCetId = async (id: number) => {
//   try {
//     return await Cetuser.findOne({ where: { user_id: id }, raw: true, nest: true });
//   } catch (error) {
//     throw error;
//   }
// };

// export const assignCetToUser = async (
//   req: any,
//   res: any,
//   getData: any,
// ) => {
//   try {
//     const { username, name, phone, email, password, cet_id } = req.body;

//     const phoneNumber = String(phone).trim();
//     const trimmedUsername = username.trim().toLowerCase();
//     const trimmedEmail = email.toLowerCase();

//     // Check if user already exists
//     const existingUser = await User.findOne({ where: { username: trimmedUsername } });
//     if (existingUser) {
//       throw new Error('Username already exists');
//     }

//     // Hash password asynchronously
//     const hashedPassword = await bcrypt.hash(password, 8);

//     // Create user
//     const userInsert = await User.create({
//       username: trimmedUsername,
//       name,
//       phone: phoneNumber,
//       email: trimmedEmail,
//       role_id: getData.role_id,
//       permission_id: getData.id,
//       status: true,
//       isAdmin: false,
//       password: hashedPassword,
//     });

//     // Assign CET to user
//     const userData = await Cetuser.create({
//       user_id: userInsert.id,
//       cet_id: cet_id,
//     });

//     return { userData, userInsert };
//   } catch (error) {
//     throw new Error(`Failed to assign CET to user: ${error.message}`);
//   }
// };

type UserRole =
  | 'LMC_ADMIN'
  | 'TENANT_ADMIN'
  | 'CENTER_ADMIN'
  | 'STAFF'
  | 'EDITOR'
  | 'VIEWER'
  | 'SUPPORT'
  | 'AUDITOR'
  | 'DOCTOR'
  | 'PHARMACY'
  | 'NURSE';

interface ScopeUser {
  id: number;
  role: UserRole;
  tenant_id?: number | null;
  center_id?: number | null;
}


const TENANT_SCOPED_ROLES = new Set([
  'TENANT_ADMIN',
  'EDITOR',
  'VIEWER',
  'SUPPORT',
  'AUDITOR'
]);

function buildSafeOwnershipWhere(userId: number, model: any) {
  const possibleFields = [
    'user_id',
    'created_by',
    'added_by',
    'AddedBy',
    'createdBy',
    'added_by_id',
    'addedby',
    'addedBy'
  ];

  const validFields = possibleFields.filter(
    (field) => model.rawAttributes?.[field],
  );

  if (!validFields.length) return {};

  return {
    [Op.or]: validFields.map((field) => ({
      [field]: userId,
    })),
  };
}

export function buildScopeWhere(user: ScopeUser, model: any) {
  const where: any = {};

  // 🧠 SUPER ADMIN
  if (user.role === 'LMC_ADMIN') return where;

  // 🏢 TENANT SCOPED
  if (TENANT_SCOPED_ROLES.has(user.role)) {
    where.tenant_id = user.tenant_id;
    return where;
  }

  // 🏥 CENTER ADMIN
  if (user.role === 'CENTER_ADMIN'|| user.role === 'DOCTOR' || user.role === 'PHARMACY' || user.role === 'NURSE') {
    where.tenant_id = user.tenant_id;
    where.center_id = user.center_id;
    return where;
  }

  // 👥 STAFF
  if (user.role === 'STAFF' ) {
    where.tenant_id = user.tenant_id;
    where.center_id = user.center_id;
    where[Op.or] = buildSafeOwnershipWhere(user.id, model);
    return where;
  }
  

  throw new Error('Invalid role');
}
