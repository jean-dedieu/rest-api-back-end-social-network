const express = require('express');
const { check } = require('express-validator');

const playersControllers = require('../controllers/players-controllers');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/:pid', playersControllers.getPlayerById);

router.get('/academy/:uid', playersControllers.getPlayersByAcademyId);

router.use(checkAuth);

router.post(
  '/',
  fileUpload.single('image'),
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address')
      .not()
      .isEmpty()
  ],
  playersControllers.createPlayer
);

router.patch(
  '/:pid',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 })
  ],
  playersControllers.updatePlayer
);

router.delete('/:pid', playersControllers.deletePlayer);

module.exports = router;
