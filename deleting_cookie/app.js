const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://srikanth19:1858260338@cluster0.5sgelp9.mongodb.net/shop?retryWrites=true&w=majority';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store }));

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(MONGODB_URI)
.then(result => {
    // console.log(result);
    User.findOne()
    .then(user => {
        if(!user) {
            const user = new User({
                name: "srikanth",
                email: "sri@gmail.com",
                cart: {
                    items: []
                }
            });   
            user.save();
        }
    })

    app.listen(3000, () => {
        console.log("Server is running at 3000 port and connected to shop DB");
    });
})
.catch(err => {
    console.log(err);
})

