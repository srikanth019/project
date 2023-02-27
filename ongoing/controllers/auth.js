const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
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
   
   const errors = validationResult(req);
   
   if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg
        });
   }

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
    
    const errors = validationResult(req); 
    if (!errors.isEmpty()) {
        // console.log(errors.array());
        return res.status(422).render('auth/signup', {
            pageTitle: 'SignUp',
            path: '/signup',
            errorMessage: errors.array()[0].msg
        });
    }

    bcrypt.hash(password, 12)
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
            html: `<h1>You Successfully Signedup to our first Node-Shop App</h1>
                <p>Your password is: "${password}" </p>
            `
        })
    })
    .catch(err => {
        console.log(err);
    });
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err)=> {
        console.log(err);
        res.redirect('/');
    });
};

exports.getReset = (req,res,next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message
    });
};

exports.postReset = (req,res,next) => {
    crypto.randomBytes(32, (err,buffer) => { //here 2nd arg is the cb it will be executed once it done.
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email})
        .then(user => {
            if (!user) {
                req.flash('error', 'No account is Found with this Email')
                res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then(result => {
            res.redirect('/');
            transporter.sendMail({
                to: req.body.email,
                from: 'mailto:srikanth.golla@brainvire.com',
                subject: "Password Reset",
                text: 'Hello from Node-Project Password Resetting',
                html: `
                    <p>You requested password reset</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset user password.</p>
                `
            });
        })
        .catch(err => {
            console.log(err);
        })

    })
};

exports.getNewPassword = (req,res,next) => {
    const token = req.params.token;
    User.findOne( { resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
        console.log(user);
        let message = req.flash('error');
        if (message.length > 0) {
            message = message[0];
        } else {
            message = null;
        }
        res.render('auth/new-password', {
            pageTitle: 'New Password',
            path: '/new-password',
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token,
            email: user.email
        });
    })
    .catch(err => {
        console.log(err);
    })
    
};

exports.postNewPassword = (req,res,next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    const email = req.body.email;

    let resetUser;

    User.findOne( { 
        resetToken: passwordToken,
        resetTokenExpiration : { $gt: Date.now() },
        _id: userId
    })
    .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save()
    })
    .then(result => {
        res.redirect('/login');
        transporter.sendMail({
            to: email,
            from: 'mailto:srikanth.golla@brainvire.com',
            subject: "Password Successfully Changed",
            text: 'Hello from Node-Project',
            html: `
                <h1>You have Successfully Changed Your Password</h1>
                <p>Your new password is: "${newPassword}"</p>
            `
        })
    })
    .catch(err => {
        console.log(err);
    })

}