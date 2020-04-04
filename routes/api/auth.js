const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route   GET api/auth
// @desc    Test route
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Find user based on ID from decoded JWT - without password
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);

    //
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a password").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    // if there are errors...
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });

      // If not a user with that email address, throw error
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // Check if password matches with the one stored for that user
      const isMatch = await bcrypt.compare(password, user.password);

      // If no match...
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // If it does match, create payload
      const payload = {
        user: {
          id: user.id,
        },
      };

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
