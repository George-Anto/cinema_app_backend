const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const slugify = require('slugify');
// const cloudPatterns = require('../utils/cloudPatterns');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please tell is your name!'] },
    surname: { type: String, required: [true, 'Please tell is your surname!'] },
    username: {
      type: String,
      unique: true,
      required: [true, 'Please enter a username!'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    mobilePhone: {
      type: String,
      required: [true, 'Please provide your mobile phone number'],
      unique: true,
      validate: [
        validator.isMobilePhone,
        'Please provide a valid mobile phone number',
      ],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'ticketAdmin', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!!!
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!',
      },
    },

    colorBlind: { type: Boolean, default: false, select: true },
    age: { type: Number, default: 0, min: 0 },
    hasChildren: { type: Boolean, default: false, select: true },
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
    address: {
      street: { type: String },
      number: { type: Number },
      district: { type: String },
      city: { type: String },
      latitude: { type: Number, select: true },
      longitude: { type: Number, select: true },
    },
    favoriteDays: {
      sunday: { type: Boolean, default: false },
      monday: { type: Boolean, default: false },
      tuesday: { type: Boolean, default: false },
      wednesday: { type: Boolean, default: false },
      thursday: { type: Boolean, default: false },
      friday: { type: Boolean, default: false },
      saturday: { type: Boolean, default: false },
    },
    friends: [{ type: [mongoose.Schema.Types.ObjectId], ref: 'User' }],

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: { type: Boolean, default: true, select: false },
    createdAt: { type: Date, default: Date.now, select: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//MIDDLEWARE
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // second parameter is how cpu intensive calculations will be made for the password (default value is  10)
  this.password = await bcrypt.hash(this.password, 12);
  // After this point we dont need the passwordConfirm field;
  this.passwordConfirm = undefined;
  next();
});

//DOCUMENT MIDDLEWARE: runs before the .save() and .create() but not .insertMany()
userSchema.pre('save', function (next) {
  this.username = slugify(this.username);
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // not accurate time save because of JWT iot
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });

  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // fast encryption
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 1000 * 60;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
