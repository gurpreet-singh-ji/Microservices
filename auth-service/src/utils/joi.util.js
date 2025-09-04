import joi from "joi";

const validationRegisterUser = (data) => {
    const schema = joi.object({
        firstName: joi.string().required(),
        lastName: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required().min(6),
        username: joi.string().required().min(3).max(50),
    })
    return schema.validate(data);
}

const validationLoginUser = (data) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required().min(6),
        username: joi.string().required().min(3).max(50),
        
    })
    return schema.validate(data);
}

export {validationRegisterUser,validationLoginUser};