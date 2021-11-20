const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const Academy = require('../models/academy');

const getAcademies = async (req, res, next) => {
  let academies;
  try {
    academies = await Academy.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching academies failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ academies: academies.map(academy => academy.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password } = req.body;

  let existingAcademy;
  try {
    existingAcademy = await Academy.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingAcademy) {
    const error = new HttpError(
      'Academy exists already, please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create Academy, please try again.',
      500
    );
    return next(error);
  }

  const createdAcademy = new Academy({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    players: []
  });
  try {
    await createdAcademy.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { academyId: createdAcademy.id, email: createdAcademy.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ academyId: createdAcademy.id, email: createdAcademy.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingAcademy;

  try {
    existingAcademy = await Academy.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingAcademy) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingAcademy.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { academyId: existingAcademy.id, email: existingAcademy.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({
    academyId: existingAcademy.id,
    email: existingAcademy.email,
    token: token
  });
};

exports.getacademies = getAcademies;
exports.signup = signup;
exports.login = login;
