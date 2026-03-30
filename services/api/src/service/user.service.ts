import { prisma } from "@/lib/prisma";
import { signToken, hashPassword, verifyPassword } from "@/lib/auth";
import { ServiceResponse } from "@/utils/serviceResponse";
import { StatusCodes } from "http-status-codes";
import { TLogin, TObjectId, TCreateUser, TUpdateUser, TRegisterUser } from "@/validations/index";
import AppError from "@/utils/appError";
import type { User, UserRole } from "@prisma/client";

export class UserService {
  async create(user: TCreateUser): Promise<ServiceResponse<Omit<User, "passwordHash"> | null>> {
    const passwordHash = await hashPassword(user.password as string);
    const newUser = await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        passwordHash,
        role: user.role as UserRole,
        organizationId: user.organization as string | undefined,
      },
    });
    const { passwordHash: _, ...safeUser } = newUser;
    return ServiceResponse.success("User created successfully", safeUser, StatusCodes.CREATED);
  }

  async register(
    userData: TRegisterUser
  ): Promise<ServiceResponse<{ user: Omit<User, "passwordHash">; token: string } | null>> {
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
      { user: safeUser, token },
      StatusCodes.CREATED
    );
  }

  async findById(_id: TObjectId["id"]): Promise<ServiceResponse<Omit<User, "passwordHash"> | null>> {
    const user = await prisma.user.findUnique({ where: { id: _id } });
    if (!user) return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
    const { passwordHash: _, ...safeUser } = user;
    return ServiceResponse.success("User found", safeUser);
  }

  async findAll(): Promise<ServiceResponse<Omit<User, "passwordHash">[] | null>> {
    const users = await prisma.user.findMany({
      omit: { passwordHash: true } as any,
    });
    if (!users.length) return ServiceResponse.failure("No Users found", null, StatusCodes.OK);
    return ServiceResponse.success("Users retrieved successfully", users as any);
  }

  async findByOrganization(organizationId: string): Promise<ServiceResponse<any[] | null>> {
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, organizationId: true, active: true, createdAt: true, updatedAt: true,
        organization: { select: { name: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return ServiceResponse.success("Users retrieved successfully", users);
  }

  async update(data: { body: TUpdateUser; id: TObjectId["id"] }): Promise<ServiceResponse<Omit<User, "passwordHash"> | null>> {
    const allowed = ["firstName", "lastName", "email"] as const;
    const filtered = Object.fromEntries(
      Object.entries(data.body).filter(([k]) => (allowed as readonly string[]).includes(k))
    );
    const updatedUser = await prisma.user.update({ where: { id: data.id }, data: filtered });
    const { passwordHash: _, ...safeUser } = updatedUser;
    return ServiceResponse.success("User updated successfully", safeUser);
  }

  async login(
    user: TLogin
  ): Promise<ServiceResponse<{ user: Omit<User, "passwordHash">; token: string } | null>> {
    const foundUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!foundUser || !(await verifyPassword(user.password as string, foundUser.passwordHash))) {
      return ServiceResponse.failure("Incorrect email or password", null, StatusCodes.BAD_REQUEST);
    }
    const token = signToken(foundUser.id);
    const { passwordHash: _, ...safeUser } = foundUser;
    return ServiceResponse.success("Logged in successfully", { user: safeUser, token });
  }
}

export const userService = new UserService();
