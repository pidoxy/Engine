import { prisma } from "@/lib/prisma";
import { signToken, hashPassword, verifyPassword } from "@/lib/auth";
import { serializeUser, type SafeApiUser } from "@/utils/contractTransforms";
import { ServiceResponse } from "@/utils/serviceResponse";
import { StatusCodes } from "http-status-codes";
import { TLogin, TIdParam, TCreateUser, TUpdateUser, TRegisterUser } from "@/validations/index";
import AppError from "@/utils/appError";
import type { User, UserRole } from "@prisma/client";

export class UserService {
  async create(user: TCreateUser): Promise<ServiceResponse<SafeApiUser | null>> {
    const passwordHash = await hashPassword(user.password as string);
    const newUser = await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        passwordHash,
        ...(user.role ? { role: user.role as UserRole } : {}),
        ...(user.organization ? { organizationId: user.organization as string } : {}),
      },
    });
    const { passwordHash: _, ...safeUser } = newUser;
    return ServiceResponse.success(
      "User created successfully",
      serializeUser(safeUser),
      StatusCodes.CREATED
    );
  }

  async register(
    userData: TRegisterUser
  ): Promise<ServiceResponse<{ user: SafeApiUser; token: string } | null>> {
    const organization = await prisma.organization.findUnique({
      where: { id: userData.organization as string },
    });
    if (!organization) throw new AppError("Organization not found", StatusCodes.NOT_FOUND);

    const passwordHash = await hashPassword(userData.password as string);
    const newUser = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordHash,
        role: userData.role as UserRole,
        organizationId: userData.organization as string,
      },
    });

    const token = signToken(newUser.id);
    const { passwordHash: _, ...safeUser } = newUser;
    return ServiceResponse.success(
      "User registered successfully",
      { user: serializeUser(safeUser), token },
      StatusCodes.CREATED
    );
  }

  async findById(_id: TIdParam["id"]): Promise<ServiceResponse<SafeApiUser | null>> {
    const user = await prisma.user.findUnique({ where: { id: _id } });
    if (!user) return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
    const { passwordHash: _, ...safeUser } = user;
    return ServiceResponse.success("User found", serializeUser(safeUser));
  }

  async findAll(): Promise<ServiceResponse<SafeApiUser[] | null>> {
    const users = await prisma.user.findMany();
    if (!users.length) return ServiceResponse.failure("No Users found", null, StatusCodes.OK);
    return ServiceResponse.success(
      "Users retrieved successfully",
      users.map(({ passwordHash: _, ...safeUser }) => serializeUser(safeUser))
    );
  }

  async findByOrganization(organizationId: string): Promise<ServiceResponse<SafeApiUser[] | null>> {
    const users = await prisma.user.findMany({
      where: { organizationId },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return ServiceResponse.success(
      "Users retrieved successfully",
      users.map(({ passwordHash: _, ...safeUser }) => serializeUser(safeUser))
    );
  }

  async update(data: { body: TUpdateUser; id: TIdParam["id"] }): Promise<ServiceResponse<SafeApiUser | null>> {
    const allowed = ["firstName", "lastName", "email"] as const;
    const filtered = Object.fromEntries(
      Object.entries(data.body).filter(([k]) => (allowed as readonly string[]).includes(k))
    );
    const updatedUser = await prisma.user.update({ where: { id: data.id }, data: filtered });
    const { passwordHash: _, ...safeUser } = updatedUser;
    return ServiceResponse.success("User updated successfully", serializeUser(safeUser));
  }

  async login(
    user: TLogin
  ): Promise<ServiceResponse<{ user: SafeApiUser; token: string } | null>> {
    const foundUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!foundUser || !(await verifyPassword(user.password as string, foundUser.passwordHash))) {
      return ServiceResponse.failure("Incorrect email or password", null, StatusCodes.BAD_REQUEST);
    }
    const token = signToken(foundUser.id);
    const { passwordHash: _, ...safeUser } = foundUser;
    return ServiceResponse.success("Logged in successfully", { user: serializeUser(safeUser), token });
  }
}

export const userService = new UserService();
