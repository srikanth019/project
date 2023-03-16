const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');   
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const errorController = require('./controllers/error');
const User = require('./models/user');

// console.log(process.env.NODE_ENV)

const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.5sgelp9.mongodb.net/${process.env.MONGODB_DEFALT_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

const fileStorage= multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + "-" + file.originalname)
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    {flags: 'a'}
);

//setting secure headers
app.use(helmet());
//compress the files
app.use(compression());

app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store }));

app.use(csrfProtection);
app.use(flash());

app.use((req,res,next) => {
    res.locals.isAuthenticated = req.session.isLogedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req,res,next) => {
    // console.log(req.session.user);
    // throw new Error('Sync Dummy');
    //For Synchronous code just through the new error 
    if(!req.session.user) {
        return next();
    } else {
        User.findById(req.session.user._id)
        .then(user => {
            // throw new Error('Async Dummy');
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            // console.log(err);
            //for Async code like clb's we have to wrap the new error into next()
            next(new Error(err));   
        });
    }
});

app.use('/admin', adminRoutes);
app.use(shopRoutes); 
app.use(authRoutes);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500',{
        pageTitle: 'Error',
        path: '/500'
    })
})

mongoose.connect(MONGODB_URI)
.then(result => {
    // console.log(result);
    // https
    // .createServer({ key: privateKey, cert: certificate }, app)
    // .listen(process.env.POST || 3000, () => {
    //     console.log("Server is running at 3000 port and connected to shop DB");
    // });
    app.listen(process.env.POST || 3000, () => {
        console.log("Server is running at 3000 port and connected to shop DB");
    });
})
.catch(err => {
    console.log(err);
})

