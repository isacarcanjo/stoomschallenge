import { body, param } from 'express-validator'

export const createCustomerValidator = () => {
  return [
    body('name').notEmpty().isString().trim(),
    body('email').isEmail().trim(),
    body('password').isLength({ min: 8 }),
  ]
}
export const createOperatorValidator = () => {
  return [
    body('name').notEmpty().isString().trim(),
    body('email').isEmail().trim(),
    body('document').isLength({ min: 11 }),
    body('password').isLength({ min: 8 }),
  ]
}

export const loginValidator = () => {
  return [
    body('email').isEmail().trim(),
    body('password').isLength({ min: 8 }),
  ]
}

export const addDeviceValidator = () => {
  return [
    param('deviceid').notEmpty().isString().trim(),
  ]
}