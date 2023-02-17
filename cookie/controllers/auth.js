const session = require("express-session");

exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split('=')[1] === 'true';
    console.log(req.session.isLoggedIn);
    res.render('auth/login', {
      pageTitle: 'Login',
      path: '/login',
      isAuthenticated: false
    });
};

exports.postLogin = (req, res, next) => {
    req.session.isLoggedIn = true;
    res.redirect('/');
};