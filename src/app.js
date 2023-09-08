/* -------------IMPORTS-------------*/
import MongoStore from 'connect-mongo';
import express from 'express';
import exphbs from 'express-handlebars';
import session from 'express-session';
import 'express-async-errors';
import morgan from 'morgan';
import { Server as SocketServer } from 'socket.io';
import http from 'http';
import websockets from './config/sockets.config.js';
import { connectMongo } from './config/configMongoDB.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import initPassport from './config/passport.config.js';
import './config/passport.config.js';
import { __dirname } from './configPath.js';
import config from './config/envConfig.js';
import { logger } from './utils/logger.js';
import indexRoutes from './routes/index.routes.js';

// ----------SWAGGER CONFIG-------------
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';

const specs = swaggerJSDoc({

  definition: {
  openapi: '3.0.1',
  
  info: {
  title: 'Documentacion de App de PS5 STORE',
  description: 'Este proyecto es una tienda virtual de juegos de PS5',
  },
},

  // apis: [`${__dirname}/docs/**/*.yaml`], 
  apis: ['./src/docs/Products/Products.yaml', './src/docs/Carts/Carts.yaml'],
  });
  

/*-------CONFIG BASICAS Y CONEXION A BD-------*/
const app = express();
const port = config.port;

/*-------SETTING MIDDLEWARES-------*/
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

/*-------SETTING HANDLEBARS-------*/
app.engine('handlebars', exphbs.engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

/*-------SERVIDORES-------*/
const httpServer = http.createServer(app);
const io = new SocketServer(httpServer);
websockets(io);
const server = httpServer.listen(port, () => {
  // Conexión a DB Atlas.
  connectMongo()
    .then(() => {
      logger.info('☁ Connected to MongoDB');
    })
    .catch((error) => {
      logger.error('Error connecting to MongoDB:', error);
      throw 'Cannot connect to the database';
    });
  logger.info(`Server listening on port: ${port}`);
});
server.on('error', (error) => logger.error(error));

/*-------SESSION-------------*/
app.use(cookieParser('mySecret'));
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@codercluster.foujega.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
      mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
      ttl: 60 * 10,
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
/*-------PASSPORT-------------*/
initPassport();
app.use(passport.initialize());
app.use(passport.session());

/*-------ROUTES-------*/
app.use('/apidocs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs));

app.use('/', indexRoutes);


