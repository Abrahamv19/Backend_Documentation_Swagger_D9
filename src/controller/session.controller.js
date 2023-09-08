import userDTO from '../DAO/DTO/user.dto.js';
import { logger } from "../utils/logger.js";

class AuthController{
    async renderLogin  (req, res) {
        logger.debug('Rendering login page');
        return res.render("login",{})
        }
    async login  (req, res) {
        if (!req.user) {
            logger.error('Invalid login attempt: Invalid Credentials');
            req.session.user = {
                _id: req.user._id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                rol: req.user.rol,
                age: req.user.age,
                cartID: req.user.cartID,
                };
            return res.status(400).json({ error: "Invalid Credentials" });
        }
        const { _id, email, firstName, lastName, age, role } = req.user;
        req.session.user = { _id, email, firstName, lastName, age, role };
        logger.info('User logged in successfully', req.user);
        return res.status(200).json({ status: "success", message: "User logged in successfully", payload: req.user });
    };
    async register  (req, res)  {
        req.session.user = {
            _id: req.user._id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            rol: req.user.rol,
            age: req.user.age,
            cartID: req.user.cartID,
        };
        logger.info('User created successfully', req.user);
        return res.status(201).json({ status: "success", message: "User created successfully", payload: req.user });
    };
    async failRegister  (req, res)  {
        logger.error('Error adding user during registration');
        return res.status(400).json({ status: "error", message: "Error adding user" });
      }
    async failLogin  (req, res)  {
        logger.error('Wrong user or password during login attempt');
        return res.status(400).json({ status: "error", message: "Wrong user or password" });
    }
    async logout (req, res) {
        req.session.destroy((error) => {
            if (error) {
                return res.status(500).json({ status: "error", message: "Error! Couldn't logout!" });
            }
            res.clearCookie("connect.sid");
            logger.info('User logged out successfully');
            return res.status(200).json({ status: "success", message: "Logout succesfully!" });
        });
    }
    async renderRegister  (req, res) {
        logger.debug('Rendering register page');
        return res.render("register",{})
        }
    async registerGithub (req, res)  {
        req.session.user = req.user;
        logger.info('User registered through GitHub and redirected to products');
        res.redirect('/products');
    }
    async getCurrent (req, res) {
        const user = new userDTO(req.session.user)
        logger.debug('Rendering user profile page');
        return res.render("profile", user);
    }
};

export const authController = new AuthController();