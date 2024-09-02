import { body } from 'express-validator'

export const createDeviceValidator = () => {
  return [
    // body('model').notEmpty().isString().trim(),
    // body('manufacture').notEmpty().isString().trim(),
    // body('version').notEmpty().isString().trim(),
    body('plan').notEmpty().isString().trim(),
    body('name').notEmpty().isString().trim(),
  ]
}