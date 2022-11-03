const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRoute');
const cinemaRouter = require('./routes/cinemaRoute');
const movieRouter = require('./routes/movieRoute');
const sessionRouter = require('./routes/sessionRoute');
const reservationRouter = require('./routes/reservationRoute');
const invitationRouter = require('./routes/invitationRoute');
const guestRouter = require('./routes/guestRoute');

const app = express();

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use('/api', limiter);

// Developement logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// only affects API route
// Limits requests from same IP
//app.use(helmet());
app.use(helmet.frameguard());

// Body parser, read data from body into req.body
app.use(express.json({ limit: '10Kb' }));
app.use(
  cors({
    origin: '*',
  })
);

// Data sanitazation against NoSQL query injection
app.use(mongoSanitize());

// Data sanitazation against XSS
app.use(xss());

// Prevents parameter pollution (whitelist properties inside object)
app.use(
  hpp({
    whitelist: [
      'code',
      'name',
      'isactive',
      'createdAt',
      'updatedAt',
      'surname',
      'uername',
      'mobilePhone',
      'email',
      'seats',
      'title',
      'session',
      'cinema',
      'movie',
      'reservation',
      'checkin',
      'rating',
      'nested-movie-rating',
    ],
  })
);

// Serving static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

// 3) ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/cinemas', cinemaRouter);
app.use('/api/v1/movies', movieRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/reservations', reservationRouter);
app.use('/api/v1/invitations', invitationRouter);
app.use('/api/v1/guests', guestRouter);

//MUST BE LAST ROUTE
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// ERROR MIDLEWARE
app.use(globalErrorHandler);

module.exports = app;
