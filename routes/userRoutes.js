const express = require('express');
const UserModel = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;

//to add new user Registration endpoint
router.post('/register', async (req, res) => {
    const { username, phonenumber, address, email, password, role = 'user' } = req.body;

    try {
        const existingUser = await UserModel.findOne({ $or: [{ email }, { phonenumber }] });

        if (existingUser) {
            return res.status(400).json({ message: 'Email or Phone Number already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const activationToken = crypto.randomBytes(20).toString('hex');
        const activationTokenExpiry = Date.now() + 3600000;

        const newUser = await UserModel.create({
            username,
            phonenumber,
            address,
            email,
            password: hashedPassword,
            role,
            activationToken,
            activationTokenExpiry,
            isActive: false
        });

        // Send activation email...

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const activationURL = `${process.env.REACT_APP_BASE_URL}/api/users/activate/${activationToken}`;
        const mailOptions = {
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Account Activation',
            html: `Please activate your account by clicking the following link: <a href="${activationURL}">Activate Account</a>`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Registration successful! Please check your email to activate your account.' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Activation endpoint
router.get('/activate/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await UserModel.findOne({
            activationToken: token,
            activationTokenExpiry: { $gt: Date.now() }
        });
        console.log("User found:", user);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired activation token' });
        }

        user.isActive = true; 
        user.activationToken = undefined;
        user.activationTokenExpiry = undefined;
        await user.save();
        res.redirect(`${process.env.FRONTEND_URL}/login`);
    

    } catch (err) {
        console.error('Error during activation:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await UserModel.findOne({ username });

        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Check if the password matches
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(400).json({ message: 'Account is not activated' });
        }

        // Return success response with user details
        res.json({ 
            message: 'Login successful',
            user: { 
                ...user._doc, 
                password: undefined 
            },
            userId: user._id.toString() // Add userId to the response
        });

    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Route to get user details
router.get('/me/:userId', async (req, res) => {
    try {
        const { userId } = req.params; // Get userId from route parameters

        if (!userId) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        const user = await UserModel.findById(userId); // Fetch user from the database
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});



// Route to request a password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send the reset email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const mailOptions = {
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset Request',
            html: `You requested a password reset. Click the link to reset your password: <a href="${resetURL}">Reset Password</a>`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Password reset email sent' });
    } catch (err) {
        console.error('Error during password reset request:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Route to reset the password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await UserModel.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('Error during password reset:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Route to get all admins
router.get('/admins', async (req, res) => {
    try {
        const admins = await UserModel.find({ role: 'admin' });
        res.json(admins);
    } catch (err) {
        console.error('Error fetching admins:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Route to get all users
router.get('/', async (req, res) => {
    try {
        const users = await UserModel.find({ role: 'user' });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Update user role
router.patch('/update-role/:userId', async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    try {
        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();
        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update user details
router.put('/update/:userId', async (req, res) => {
    const { userId } = req.params;
    const { username, phonenumber, address, email } = req.body;

    try {
        // Find the user by ID
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's details
        user.username = username || user.username;
        user.phonenumber = phonenumber || user.phonenumber;
        user.address = address || user.address;
        user.email = email || user.email;

        // Save the updated user details
        await user.save();

        res.json({ message: 'User details updated successfully', user });
    } catch (err) {
        console.error('Error updating user details:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete user
router.delete('/delete-user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await UserModel.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


module.exports = router;