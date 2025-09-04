import { User } from "../model/user.model.js"

const genrateAccessRefreshTokens = async (ID) => {
    const user = await User.findById(ID)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = await refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken,refreshToken}
}
export {genrateAccessRefreshTokens};