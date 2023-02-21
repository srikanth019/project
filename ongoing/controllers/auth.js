const User = require('../models/user')

exports.getLogin = (req, res, next) => {
    // isLogedIn = req.get('Cookie').split('=')[1] === 'true';
    // console.log(req.session.isLogedIn);
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        isAuthenticated: false
    });
};

exports.postLogin = (req, res, next) => {
    // res.setHeader('Set-Cookie','logedIn=true')
    User.findById("63ecd33a9d5a76ffb3007983")
    .then(user => {
        req.session.isLogedIn = true;
        req.session.user = user;
        res.redirect('/');
    })
    .catch(err => {
        console.log(err);
    });
};


exports.postLogout = (req, res, next) => {
    req.session.destroy((err)=> {
        console.log(err);
        res.redirect('/');
    });
};