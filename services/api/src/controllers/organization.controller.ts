import type {
  TCreateOrganization,
  TUpdateOrganization,
  TCreateOrganizationWithRootUser,
} from "@/validations";
import { organizationService } from "@/service/organization.service";
import catchAsync from "@/utils/catchAsync";
import { handleServiceResponse } from "@/utils/httpHandlers";
import type { NextFunction, Request, RequestHandler, Response } from "express";

class OrganizationController {
  public createOrganization: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TCreateOrganization>,
      res: Response,
      _next: NextFunction
    ) => {
      const serviceResponse = await organizationService.create(req.body);
      return handleServiceResponse(serviceResponse, res);
    }
  );

  public getOrganization: RequestHandler<{ id: string }, any, any> = catchAsync(
    async (
      req: Request<{ id: string }>,
      res: Response,
      _next: NextFunction
    ) => {
      const id = req.params.id;
      const serviceResponse = await organizationService.findById(id);
      return handleServiceResponse(serviceResponse, res);
    }
  );

  public getOrganizations: RequestHandler = catchAsync(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const serviceResponse = await organizationService.findAll();
      return handleServiceResponse(serviceResponse, res);
    }
  );

  public updateOrganization: RequestHandler<
    { id: string },
    any,
    TUpdateOrganization
  > = catchAsync(
    async (
      req: Request<{ id: string }, any, TUpdateOrganization>,
      res: Response,
      _next: NextFunction
    ) => {
      const id = req.params.id;
      const serviceResponse = await organizationService.update({
        body: req.body,
        id,
      });
      return handleServiceResponse(serviceResponse, res);
    }
  );

  public deleteOrganization: RequestHandler<{ id: string }, any, any> =
    catchAsync(
      async (
        req: Request<{ id: string }>,
        res: Response,
        _next: NextFunction
      ) => {
        const id = req.params.id;
        const serviceResponse = await organizationService.delete(id);
        return handleServiceResponse(serviceResponse, res);
      }
    );

  public createOrganizationWithRootUser: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TCreateOrganizationWithRootUser>,
      res: Response,
      _next: NextFunction
    ) => {
      const serviceResponse = await organizationService.createWithRootUser(
        req.body
      );

      if (serviceResponse.success && serviceResponse.data) {
        const { token } = serviceResponse.data;

        // Set cookies for automatic login
        const cookieExpirationInMs = Math.floor(
          Number(process.env.JWT_COOKIE_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000
        ); // Convert days to milliseconds
        const expiresIn = new Date(Date.now() + cookieExpirationInMs);

        const cookieOptions = {
          expires: expiresIn,
          maxAge: cookieExpirationInMs,
          httpOnly: true,
          path: "/",
          sameSite:
            process.env.NODE_ENV === "production"
              ? "none"
              : ("lax" as "none" | "lax"),
          secure: process.env.NODE_ENV === "production",
          domain: process.env.COOKIE_DOMAIN,
        };

        res.cookie("access", token, cookieOptions);
        res.cookie("logged_in", true, {
          ...cookieOptions,
          httpOnly: false,
        });
      }

      return handleServiceResponse(serviceResponse, res);
    }
  );
}

export default new OrganizationController();
