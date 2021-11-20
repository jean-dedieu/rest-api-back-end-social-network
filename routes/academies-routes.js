const express = require('express');
const { check } = require('express-validator');

const academiesController = require('../controllers/academies-controllers');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', academiesController.getacademies);

router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('name')
      .not()
      .isEmpty(),
    check('email')
      .normalizeEmail()
      .isEmail(),
    check('password').isLength({ min: 6 })
  ],
  academiesController.signup
);

router.post('/login', academiesController.login);

module.exports = router;
