import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

import requestLogger from './middlewares/requestLogger.middleware.js';
import notFoundMiddleware from './middlewares/notFound.middleware.js';
import errorMiddleware from './middlewares/error.middleware.js';
import configurePassport from './config/passport.js';
import routes from './routes/index.js';

configurePassport();

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(compression());

app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'kitchen-ledger-dev',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


app.use(requestLogger);

app.use('/api/v1', routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;