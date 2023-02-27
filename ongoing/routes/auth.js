const express = require('express');

const { check, body } = require('express-validator');//param, header, cookie, query     

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [
        body('email').isEmail().withMessage('Enter a Valid E-mail'),
        body('password','Enter a Valid password')
        .isLength({ min: 6, max: 10 }).isAlphanumeric()
    ],
    authController.postLogin);

router.post('/signup',
    [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid E-mail')
        .custom((value, {req}) => {
            // if (value === "test@test.com"){
            //     throw new Error('This is Invalid E-mail address!!!!!');
            // }
            // return true;
            return User.findOne({email: value}).then(userDoc => {
                if(userDoc) {
                    return Promise.reject('This E-mail is already exists');
                }
            });
        }),
        //we can also use check validator here
        body('password', "Please Enter a password with Only numbers and text with atleast 6 characters")
        .isLength({ min: 6, max: 10 }).isAlphanumeric(),
        body('confirmPassword').custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error('Passwords should be match!!');
            }
            return true;
        })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;