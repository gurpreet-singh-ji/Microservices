import {validationRegisterUser,  validationLoginUser} from "../utils/joi.util.js";
import logger from "../utils/winston.util.js";
import { ApiResponse } from "../utils/ApiRes.utils.js";
import { User } from "../model/user.model.js";
import { genrateAccessRefreshTokens } from "../utils/token.util.js";
import jwt from "jsonwebtoken"
const registerUser = async (req,res) => {
    logger.info('endpoint hit')
    try {
        
        // validate schema
        const { error } = validationRegisterUser(
          req.body
        );
        if (error) {
            logger.warn("validation error", error.details[0].message);
            return res.status(400).json(
                new ApiResponse(400, {}, error.details[0].message)
            )
                
        }
        const {firstName, lastName, email, password, username} = req.body;
        const existedUser = await User.findOne({
            $or: [{username},{email}]
        })
        if (existedUser) {
            logger.warn("user already exist");
            return res
              .status(400)
              .json(new ApiResponse(400, {}, "user already exist"));
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            username,
        })
        logger.info("user created");
        
        return res.status(201).json(
          new ApiResponse(
            201,
            {
              user: user,
            },
            "user registered successfully"
          )
        );
    } 

    catch (error) {
        logger.error("error while registering user", error)
        return res.status(400).json(new ApiResponse(400, {}, error.message));
    }
}

const loginUser = async (req,res) => {
  logger.info("Login endpoint hit...")
  try {
   const { error } = validationLoginUser(
          req.body
        );
        if (error) {
            logger.warn("validation error", error.details[0].message);
            return res.status(400).json(
                new ApiResponse(400, {}, error.details[0].message)
            )
        }
        const {username,email,password} = req.body;
        const user = await User.findOne({ $or:[{username},{email}] })
        if (!user) {
            logger.warn("user not found");
            return res
              .status(400)
              .json(new ApiResponse(400, {}, "user not found"));
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          logger.warn("password is not matched");
          return res
            .status(400)
            .json(new ApiResponse(400, {}, "password is not matched"));
        }
        const {accessToken, refreshToken} = await genrateAccessRefreshTokens(user._id);
        console.log(accessToken, refreshToken);
        
        logger.info("user login successfully");
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              accessToken: accessToken,
              refreshToken: refreshToken,
            },
            "user login successfully"
          )
        );


  } catch (error) {
        logger.error("error while login user", error)
        return res
        .status(400)
        .json(
          new ApiResponse(400, {}, error.message)
        );
    }
  
}

const logout = async (req,res) => {
  try {
    logger.info("endpoint hit")
    
    const user = await User.findByIdAndUpdate(req.user._id, 
      {
          $set: {
            refreshToken: null,
          },
        },
        { new: true }
      );
    
    logger.info("user logout successfully");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            message: "user logout successfully",
          },
          "user logout successfully"
        ))
      } catch (error) {
        logger.error("error while logout user", error)
            return res
            .status(400)
            .json(
              new ApiResponse(400, {}, error.message)
              );
  }
}

const updateRefreshToken = async (req,res) => {
  try {
    const {comingRefreshToken} = req.body;
    const decoded = jwt.verify(comingRefreshToken, process.env.JWT_SECRET)
    const user = await User.findById(decoded._id)
    if(!user) {
      logger.warn("user not found")
    }
    if (!user.refreshToken !== comingRefreshToken) {
      logger.warn("refresh token not match")
    }
    const { accessToken, refreshToken } = await genrateAccessRefreshTokens(user);
    logger.info("refresh token updated successfully")
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "refresh token updated successfully"
        ))
    

  } catch (error) {
    logger.error("error while logout user", error)
      return res
      .status(400)
      .json(
        new ApiResponse(400, {}, error.message)
      );
  }
}

const changePassword = async (req,res) => {
  // get the oldpassword
  // check the password is correct or not
  // if correct change password and save in db
  try {
    logger.info("endpoint hit");
    const {oldPassword,newPasseord} = req.body;

    const user = await User.findById(req.user._id);
    if (!user) logger.warn("user not found");
    const passwrodCheck = await user.comparePassword(oldPassword);
    if (!passwrodCheck) {
      logger.warn("Incoorect Password")
    }
    user.password = newPasseord;
    await user.save();
    logger.info("password changed successfully");
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "password changed successfully"));
            
  } catch (error) {
    logger.error("error while chnagepassword", error)
      return res
      .status(400)
      .json(
        new ApiResponse(400, {}, error.message)
      );
  }
}

export {
    registerUser,
    loginUser,
    logout, 
    updateRefreshToken,
    changePassword,
}
