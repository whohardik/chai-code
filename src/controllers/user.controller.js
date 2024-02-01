import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloundinary } from "../utils/cloundinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
//import {generateAccessToken}

const generateAccessTokenAndRefreshtoken = async (userId) => {
  console.log(userId, "userid");
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    console.log(accessToken, refreshToken);
    await user.save({ vaildateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "something went wrong");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from postman
  const { fullName, email, username, password } = req.body;

  // vaildation--not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "ALl filed are requried");
  }
  //check user is exist
  const existUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existUser) {
    throw new ApiError(409, "user with email or username already exist");
  }
  //check image and avatar
  const avatarLoalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath= req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLoalPath) {
    throw new ApiError(400, "avatarImage is required");
  }
  // upload then into cloundinary
  const avatar = await uploadCloundinary(avatarLoalPath);
  const coverImage = await uploadCloundinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }
  //create user object--create enrty in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  //check for user creation response && remove passwar and refersh token
  const created_user = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!created_user) {
    throw new ApiError(400, "something went wrong while creating user");
  }

  //return res or send error
  return res
    .status(201)
    .json(new ApiResponse(200, created_user, "user registerd sucessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //check req body
  const { email, username, password } = req.body;
  console.log(email);
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  } else if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // check user exist via username or email
  const isexistUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!isexistUser) {
    throw new ApiError(404, "user does not exist");
  }
  // check password
  const isPasswordCorrect = await isexistUser.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "invaild user creadtionals");
  }
  console.log(isexistUser);
  //access and refersh token
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshtoken(isexistUser._id);
  console.log(accessToken);
  const user = await User.findById(isexistUser._id).select(
    "-password -refreshToken"
  );

  //send cookies

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: user,
          accessToken,
          refreshToken,
        },
        "user logged successFully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    //console.log(req.user);
    const filter = { _id: req.user._id };
    const update = { refreshToken: "" };
    const updatedUser = await User.findByIdAndUpdate(filter, update, {
      new: true,
    });
    //console.log("Updated User:", updatedUser);
    if (!updatedUser) {
      // Handle the case where the user with the specified ID was not found
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logout successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorzed token");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SCRERT
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invaild refershToken");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshtoken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accestoken", accessToken, options)
      .cookie("newRefeshtoken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
   throw new ApiError(401,error?.message || "invaild refresh token")
  }
});

export { registerUser, loginUser, logoutUser,refreshAccessToken };
