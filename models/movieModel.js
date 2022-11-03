const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    poster: {
      type: String,
    },
    runtime: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    released: {
      type: Date,
      required: true,
    },
    plot: {
      type: String,
    },
    fullplot: {
      type: String,
    },
    directors: [String],
    cast: [String],
    imdb: {
      rating: { type: Number, min: 0, max: 10 },
      votes: { type: Number, min: 0 },
    },
    tomatoes: {
      rating: { type: Number, min: 0, max: 10 },
      votes: { type: Number, min: 0 },
    },
    rating: {
      type: String,
      enum: ['Unrated', 'G', 'PG', 'PG13', 'R', 'NC-17'],
      default: 'Unrated',
    },
    genres: {
      Action: { type: Boolean, default: false },
      Comedy: { type: Boolean, default: false },
      Drama: { type: Boolean, default: false },
      Fantasy: { type: Boolean, default: false },
      Horror: { type: Boolean, default: false },
      Mystery: { type: Boolean, default: false },
      Romance: { type: Boolean, default: false },
      Thriller: { type: Boolean, default: false },
      Western: { type: Boolean, default: false },
    },
    familyMovie: { type: Boolean, default: false },
    cultStatus: { type: Boolean, default: false },
    newEntry: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

movieSchema.index({ title: 1, year: 1 }, { unique: true });

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
