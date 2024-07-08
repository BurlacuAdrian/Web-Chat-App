import Joi from 'joi';

const loginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .max(32)
    .pattern(/^\S*$/)
    .required(),
  password: Joi.string()
    .max(32)
    .pattern(/^\S*$/)
    .required()
});

const signupSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .max(32)
    .pattern(/^\S*$/)
    .required(),
  display_name: Joi.string()
    .max(32)
    .allow('')
    .optional(),
  password: Joi.string()
    .max(32)
    .pattern(/^\S*$/)
    .required()
});


export {loginSchema, signupSchema}