const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Player = require('../models/player');
const Academy = require('../models/academy');

const getPlayerById = async (req, res, next) => {
  const playerId = req.params.pid;

  let player;
  try {
    player = await Player.findById(playerId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a player.',
      500
    );
    return next(error);
  }

  if (!player) {
    const error = new HttpError(
      'Could not find player for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ player: player.toObject({ getters: true }) });
};

const getPlayersByAcademyId = async (req, res, next) => {
  const academyId = req.params.uid;

  // let players;
  let academyWithPlayers;
  try {
    academyWithPlayers = await Academy.findById(academyId).populate('players');
  } catch (err) {
    const error = new HttpError(
      'Fetching players failed, please try again later.',
      500
    );
    return next(error);
  }

  // if (!players || players.length === 0) {
  if (!academyWithPlayers || academyWithPlayers.players.length === 0) {
    return next(
      new HttpError('Could not find players for the provided Academy id.', 404)
    );
  }

  res.json({
    players: academyWithPlayers.players.map(player =>
      player.toObject({ getters: true })
    )
  });
};

const createPlayer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlayer = new Player({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.academyData.academyId
  });

  let academy;
  try {
    academy = await Academy.findById(req.academyData.academyId);
  } catch (err) {
    const error = new HttpError(
      'Creating player failed, please try again.',
      500
    );
    return next(error);
  }

  if (!academy) {
    const error = new HttpError('Could not find Academy for provided id.', 404);
    return next(error);
  }

  console.log(academy);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlayer.save({ session: sess });
    academy.players.push(createdPlayer);
    await academy.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating player failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ player: createdPlayer });
};

const updatePlayer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description } = req.body;
  const playerId = req.params.pid;

  let player;
  try {
    player = await Player.findById(playerId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update player.',
      500
    );
    return next(error);
  }

  if (player.creator.toString() !== req.academyData.academyId) {
    const error = new HttpError('You are not allowed to edit this player.', 401);
    return next(error);
  }

  player.title = title;
  player.description = description;
  //TODO: update photo photo and localisation
 

  try {
    await player.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update player.',
      500
    );
    return next(error);
  }

  res.status(200).json({ player: player.toObject({ getters: true }) });
};

const deletePlayer = async (req, res, next) => {
  const playerId = req.params.pid;

  let player;
  try {
    player = await Player.findById(playerId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete player.',
      500
    );
    return next(error);
  }

  if (!player) {
    const error = new HttpError('Could not find player for this id.', 404);
    return next(error);
  }

  if (player.creator.id !== req.academyData.academyId) {
    const error = new HttpError(
      'You are not allowed to delete this player.',
      401
    );
    return next(error);
  }

  const imagePath = player.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await player.remove({ session: sess });
    player.creator.players.pull(player);
    await player.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete player.',
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: 'Deleted player.' });
};

exports.getPlayerById = getPlayerById;
exports.getPlayersByAcademyId = getPlayersByAcademyId;
exports.createPlayer = createPlayer;
exports.updatePlayer = updatePlayer;
exports.deletePlayer = deletePlayer;
