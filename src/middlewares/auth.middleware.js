import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT=asyncHandler(async(req,res,next)=>{
 try {
      const token= req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer","");
   const decodedToken=  jwt.verify(token,process.env.ACCESS_TOKEN_SCRERT);
   const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
   if (!user) {
       throw new ApiError(401,"invaild Access Token")
   }
      if (!token) {
       throw new ApiError
      }
   
      req.user=user;
      next()
 } catch (error) {
    throw new ApiError(401,error?.message|| "invaild acessToken")
 }
})
