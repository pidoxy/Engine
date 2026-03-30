import type { TCreateUser, TUpdateUser } from "@/validations/user.schema";
import { userService } from "@/service/user.service";
import catchAsync from "@/utils/catchAsync";
import { handleServiceResponse } from "@/utils/httpHandlers";
import type { NextFunction, Request, RequestHandler, Response } from "express";

class UserController {
  public createUser: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TCreateUser>,
      res: Response,
      _next: NextFunction
    ) => {
      const serviceResponse = await userService.create(req.body);
      return handleServiceResponse(serviceResponse, res);
    }
  );
  public getUser: RequestHandler<{ id: string }, any, any> = catchAsync(
    async (
      req: Request<{ id: string }>,
      res: Response,
      _next: NextFunction
    ) => {
      const id = req.params.id;
      const serviceResponse = await userService.findById(id);
      return handleServiceResponse(serviceResponse, res);
    }
  );

  public getLoggedInUser: RequestHandler<{}, any, any> = catchAsync(
    async (req: Request<{}, {}, any>, res: Response, _next: NextFunction) => {
      const id = req.user?.id;
      const serviceResponse = await userService.findById(id);
      return handleServiceResponse(serviceResponse, res);
    }
  );

  public getUsers: RequestHandler = catchAsync(
    async (
      _req: Request<{}, {}, TCreateUser>,
      res: Response,
      _next: NextFunction
    ) => {
      const serviceResponse = await userService.findAll();
      return handleServiceResponse(serviceResponse, res);
    }
  );

  public getOrganizationUsers: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TCreateUser>,
      res: Response,
      _next: NextFunction
    ) => {
      const organizationId = req.user?.organization;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: "User organization not found",
          data: null,
          statusCode: 400,
        });
      }

      const serviceResponse = await userService.findByOrganization(
        organizationId.toString()
      );
      return handleServiceResponse(serviceResponse, res);
    }
  );

  public updateUser: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TUpdateUser>,
      res: Response,
      _next: NextFunction
    ) => {
      const id = req.user?.id;
      const serviceResponse = await userService.update({
        body: req.body,
        id,
      });
      return handleServiceResponse(serviceResponse, res);
    }
  );
}

export default new UserController();
