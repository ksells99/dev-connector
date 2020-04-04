const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password must be 6 or more characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    // if there are errors...
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });
      // Throw error
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email address already in use" }] });
      }

      // Else, proceed and get user's gravatar

      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      // Create new user, passing in values

      user = new User({ name, email, avatar, password });

      // Salt password
      const salt = await bcrypt.genSalt(10);

      // Hash password
      user.password = await bcrypt.hash(password, salt);

      // Save user - add to DB
      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      // Create JWT

      // Get JWT secret from default.json, pass in payload (id)
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },

        // callback gives either error or token
        (err, token) => {
          if (err) throw err;
          // or if there is a token, return it
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
