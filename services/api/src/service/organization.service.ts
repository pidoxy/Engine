import { prisma } from "@/lib/prisma";
import { signToken, hashPassword } from "@/lib/auth";
import { ServiceResponse } from "@/utils/serviceResponse";
import { StatusCodes } from "http-status-codes";
import { TObjectId, TCreateOrganization, TUpdateOrganization, TCreateOrganizationWithRootUser } from "@/validations";
import type { Organization, User, UserRole } from "@prisma/client";

export class OrganizationService {
  async create(data: TCreateOrganization): Promise<ServiceResponse<Organization | null>> {
    const newOrg = await prisma.organization.create({ data });
    return ServiceResponse.success("Organization created successfully", newOrg, StatusCodes.CREATED);
  }

  async findById(_id: TObjectId["id"]): Promise<ServiceResponse<Organization | null>> {
    const org = await prisma.organization.findUnique({
      where: { id: _id },
      include: { createdBy: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!org) return ServiceResponse.failure("Organization not found", null, StatusCodes.NOT_FOUND);
    return ServiceResponse.success("Organization found", org as any);
  }

  async findAll(): Promise<ServiceResponse<Organization[] | null>> {
    const orgs = await prisma.organization.findMany();
    if (!orgs.length) return ServiceResponse.failure("No Organizations found", null, StatusCodes.OK);
    return ServiceResponse.success("Organizations retrieved successfully", orgs);
  }

  async update(data: { body: TUpdateOrganization; id: TObjectId["id"] }): Promise<ServiceResponse<Organization | null>> {
    const updated = await prisma.organization.update({ where: { id: data.id }, data: data.body });
    return ServiceResponse.success("Organization updated successfully", updated);
  }

  async delete(id: TObjectId["id"]): Promise<ServiceResponse<null>> {
    await prisma.organization.delete({ where: { id } });
    return ServiceResponse.success("Organization deleted successfully", null, StatusCodes.NO_CONTENT);
  }

  async createWithRootUser(
    data: TCreateOrganizationWithRootUser
  ): Promise<ServiceResponse<{ organization: Organization; user: Omit<User, "passwordHash">; token: string } | null>> {
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: data.name, description: data.description },
      });

      const passwordHash = await hashPassword(data.password as string);
      const newUser = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash,
          role: "ORGANIZATION" as UserRole,
          organizationId: organization.id,
        },
      });

      const updatedOrg = await tx.organization.update({
        where: { id: organization.id },
        data: { createdById: newUser.id },
      });

      return { organization: updatedOrg, user: newUser };
    });

    const token = signToken(result.user.id);
    const { passwordHash: _, ...safeUser } = result.user;

    return ServiceResponse.success(
      "Organization and root user created successfully",
      { organization: result.organization, user: safeUser, token },
      StatusCodes.CREATED
    );
  }
}

export const organizationService = new OrganizationService();
