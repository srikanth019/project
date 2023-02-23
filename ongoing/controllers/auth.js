const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
// const sendGridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mailto:srikanth.golla@brainvire.com',
        pass: 'Srik@nth19'
    }
})

exports.getLogin = (req, res, next) => {
    // isLogedIn = req.get('Cookie').split('=')[1] === 'true';
    // console.log(req.session.isLogedIn);
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message
    });
};

exports.getSignup = (req,res,next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: 'SignUp',
        path: '/signup',
        errorMessage: message
    });
}

exports.postLogin = (req, res, next) => {
   const email = req.body.email;
   const password = req.body.password;
    User.findOne( { email: email } )
    .then(user => {
        if (!user) {
            req.flash('error','Invalid email or password.');
            return res.redirect('/login')
        }
        bcrypt
        .compare(password, user.password)
        .then(doMatch => {
            if (doMatch) {
                req.session.isLogedIn = true;
                req.session.user = user;
                return req.session.save((err) => {
                    console.log(err);
                    res.redirect('/');
                })
            }
            req.flash('error','Invalid email or password.');
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
            res.redirect('/login');
        })
    })
    .catch(err => {
        console.log(err);
    });
};

exports.postSignup = (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({email: email})
    .then(userDoc => {
        if (userDoc) {
            req.flash('error','This E-mail is already exists');
            return res.redirect('/signup');
        }
        return bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'mailto:srikanth.golla@brainvire.com',
                subject: "You are successfully Signedup",
                text: 'Hello from Node-Project',
                html: '<h1>You Successfully Signed up!</h1>'
            })
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log(err);
    })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err)=> {
        console.log(err);
        res.redirect('/');
    });
};