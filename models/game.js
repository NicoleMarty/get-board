const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/explore-games', { useNewUrlParser: true })
const Schema = mongoose.Schema

const gameSchema = new Schema({
  image: String,
  name: {
    type: String,
    required: true
  },
  minPlayers: {
    type: Number,
    required: true
  },
  maxPlayers: Number,
  minPlaytime: {
    type: Number,
    required: true
  },
  maxPlaytime: Number,
  minAge: {
    type: Number,
    required: true
  },
  rating: Schema.Types.Decimal128,
  rules: String,
  complexity: String,
  userId: {
    type: String,
    required: true
  },
  houseRules: [
    {
      rule: String,
      description: String
    }
  ]
})

const Game = mongoose.model('Game', gameSchema)

module.exports = Game
