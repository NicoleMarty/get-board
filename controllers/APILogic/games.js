const db = require("../../models");

const createFilter = (req) => {

    const filters = {
        userId: req.user._id
    }

    if (req.query.name) {
        filters.name = {
            $regex: req.query.name,
            $options: "i"
        }
    }

    if (req.query.numPlayers) {
        filters.minPlayers = { $lte: req.query.numPlayers }
        filters.maxPlayers = { $gte: req.query.numPlayers }
    }

    if (req.query.minPlaytime) {
        filters.minPlaytime = { $lte: req.query.minPlaytime }
    }

    if (req.query.maxPlaytime) {
        filters.maxPlaytime = { $gte: req.query.maxPlaytime }
    }

    if (req.query.minAge) {
        filters.minAge = { $lte: req.query.minAge }
    }

    if (req.query.rating) {
        filters.rating = { $gte: req.query.rating }
    }

    if (req.query.complexity) {
        filters.complexity = req.query.complexity
    }
    
    if (req.query._id) {
        filters._id = req.query._id
    }

    return filters
}

// Defining methods for the gamesController
module.exports = {
    find: function (req, res) {
        db.User.findOne({
            currentToken: req.query.token
        }).then(user => {
            if (!user) {
                return res.status(404).send("User not found!");
            }

            req.user = user;
            const filters = createFilter(req);

            db.Game.find(filters).sort({name: "asc"})
                .then(dbModel => res.json(dbModel))
                .catch(err => res.status(400).send("There was a problem with your game search request. Please try again."));
        }).catch(error => res.status(400).send("There was a problem with initializing your request. Please try again."));
    },
    create: function (req, res) {
        db.Game.create({
            ...req.body,
            userId: req.user._id
        }).then(function (newGame) {
            db.User.findOneAndUpdate({
                _id: req.user._id
            }, {
                $push: {
                    games: newGame
                }
            }).then(dbModel => db.User.find({
                _id: req.user._id
            }).then(function (dbUser) {
                res.json(dbUser)
            }).catch(err => res.status(400).send("There was a responding with the user's updated games list.")));

        }).catch(error => res.status(400).send("There was a problem saving the new game. Please try again."));
    },
    update: function (req, res) {
        db.User.findOne({
            currentToken: req.body.token
        }).then(user => {

            if (!user) {
                return res.status(404).send("User not found!");
            }
            
            req.user = user;

            if (!req.body._id) {
                module.exports.create(req, res);
                return
            }

            db.Game.findOneAndUpdate({
                _id: req.body._id,
                userId: req.user._id
            }, {
                $set: {
                    ...req.body,
                    userId: req.user._id
                }
            }).then(game => {

                // should never actually hit this if statement, this is entirely for a catch all
                if (!game) {
                    return module.exports.create(req, res);
                }
                db.Game.find({
                    _id: req.body._id,
                    userId: req.user._id
                })
                    .then(updatedGame => res.json(updatedGame))
                    .catch(err => res.status(400).send("There was a problem finding the updated game."))
            }).catch(error => res.status(404).send("There was a problem updating the game. Nothing was saved to the database."));
        }).catch(error => res.status(400).send("There was a problem with initializing your request. Please try again."));
    },
    remove: function (req, res) {
        db.User.findOne({
            currentToken: req.query.token
        }).then(user => {
            
            if (!user) {
                return res.status(404).send("User not found!");
            }
            db.Game.find({
                userId: user._id,
                _id: req.query.id
            }).then(game => {

                if (!game) {
                    return res.status(404).send("No game found!");
                }

                db.Game.remove({
                    _id: game
                }).then(dbModel => {

                    db.User.findByIdAndUpdate(user._id, {
                        $pull: {
                            "games": {
                                $in: game[0]._id
                            }
                        }
                    }, function (errors, model) {
                        if (errors) {
                            return res.status(422).json(errors);
                        }
                        db.User.find({
                            _id: user._id
                        }).then(function (dbUser) {
                            res.json(dbUser)
                        }).catch(err => res.status(404).send("There was problem reloading your user after deleting the game."));
                    });
                })
                    .catch(errs => res.status(400).send("There was a problem removing this game from your library. Please try again."));

            }).catch(err => res.status(404).send("There was a problem finding a game to remove. Nothing was removed your library."));
        }).catch(error => res.status(400).send("There was a problem with initializing your request. Please try again."));
    }
};