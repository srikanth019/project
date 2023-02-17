const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://srikanth19:1858260338@cluster0.5sgelp9.mongodb.net/shop?retryWrites=true&w=majority'

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ 
    secret : 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use((req,res,next) => {
    User.findById("63ecd33a9d5a76ffb3007983")
    .then(user => {
        req.user = user;
        next()
    })
    .catch(err => {
        console.log(err);
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(
  MONGODB_URI
)
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




// const path = require('path');

// const express = require('express');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');

// const errorController = require('./controllers/error');
// const User = require('./models/user');

// const app = express();

// app.set('view engine', 'ejs');
// app.set('views', 'views');

// const adminRoutes = require('./routes/admin');
// const shopRoutes = require('./routes/shop');

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.static(path.join(__dirname, 'public')));

// app.use((req, res, next) => {
//   User.findById('5bab316ce0a7c75f783cb8a8')
//     .then(user => {
//       req.user = user;
//       next();
//     })
//     .catch(err => console.log(err));
// });

// app.use('/admin', adminRoutes);
// app.use(shopRoutes);

// app.use(errorController.get404);

// mongoose
//   .connect(
//     'mongodb+srv://maximilian:9u4biljMQc4jjqbe@cluster0-ntrwp.mongodb.net/shop?retryWrites=true'
//   )
//   .then(result => {
//     User.findOne().then(user => {
//       if (!user) {
//         const user = new User({
//           name: 'Max',
//           email: 'max@test.com',
//           cart: {
//             items: []
//           }
//         });
//         user.save();
//       }
//     });
//     app.listen(3000);
//   })
//   .catch(err => {
//     console.log(err);
//   });
