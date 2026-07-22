import { setAuthenticationCookies } from "../../common/utils/cookie.js";
import {
  loginSchema,
  registerSchema,
} from "../../common/validators/auth.validator.js";
import { HTTPSTATUS } from "../../config/http.config.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { AuthService } from "./auth.service.js";
import type { Request, Response } from "express";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = registerSchema.parse({
        ...req.body,
      });

      const { user } = await this.authService.register(body);

      return res
        .status(HTTPSTATUS.CREATED)
        .json({ message: "User registered Successfully", data: user });
    },
  );

  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userAgent = req.get("user-agent");
      const body = loginSchema.parse({
        ...req.body,
        userAgent,
      });

      const { user, accessToken, refreshToken, mfaRequired } =
        await this.authService.login(body);

      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
        mfaRequired,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: "User logged in Successfully",
          mfaRequired,
          user,
        });
    },
  );
}
