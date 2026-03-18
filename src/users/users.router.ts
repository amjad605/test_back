import { Router } from "express";
import authController from "../auth/auth.controller";
import userController from "./users.controller";
import { upload } from "../utils/multer";
const userRouter = Router();
userRouter.use(authController.authenticateToken);
userRouter
  .route("/")
  .get(authController.authorizeStaff, userController.getUsers)
  .post(authController.authorizeOwner, userController.createUser);
userRouter
  .route("/internal")
  .get(authController.authorizeOwner, userController.getInternalUsers)
  .post(
    authController.authorizeOwner,
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "attachments", maxCount: 10 },
    ]),
    userController.createInternalUser,
  );

userRouter
  .route("/:id")
  .get(authController.authorizeOwner, userController.getUser)
  .patch(authController.authorizeOwner, userController.updateUser)
  .delete(authController.authorizeOwner, userController.deleteUser);
userRouter
  .route("/internal/:id")
  .get(authController.authorizeOwner, userController.getInternalUser)
  .patch(
    authController.authorizeOwner,
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "attachments", maxCount: 10 },
    ]),
    userController.updateInternalUser,
  )
  .delete(authController.authorizeOwner, userController.deleteInternalUser);
export default userRouter;
