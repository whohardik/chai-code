import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadCloundinary} from "../utils/cloundinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async(req,res)=>{
   //get user details from postman
const {fullName,email,username,password}=req.body;
console.log("fullname",fullName);


   // vaildation--not empty
   if([fullName,email,username,password].some((field)=>field?.trim()==="")){
      throw new ApiError(400,"ALl filed are requried")
      }
   //check user is exist
   const existUser= await User.findOne({
      $or:[{email},{username}]
   })
   if(existUser){
      throw new ApiError(409,"user with email or username already exist")
   }
   //check image and avatar
   const avatarLoalPath=req.files?.avatar[0]?.path;
   //const coverImageLocalPath= req.files?.coverImage[0]?.path;
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length >0) {
      coverImageLocalPath=req.files.coverImage[0].path
   }
   if (!avatarLoalPath) {
      throw new ApiError(400,"avatarImage is required")
   }
   // upload then into cloundinary
const avatar=await uploadCloundinary(avatarLoalPath);
const coverImage= await uploadCloundinary(coverImageLocalPath);
if(!avatar){
   throw new ApiError(400,"avatar is required")
}
   //create user object--create enrty in db
 const user= await  User.create({
      fullName,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
      email,password,
      username:username.toLowerCase()
   })
    //check for user creation response && remove passwar and refersh token
   const created_user=await User.findById(user._id).select(
      "-password -refreshToken" 
   )

   if (!created_user) {
      throw new ApiError(400,"something went wrong while creating user")
   }
  
   //return res or send error
   return res.status(201).json(
new ApiResponse(200,created_user,"user registerd sucessfully")
   )
})

export {registerUser}