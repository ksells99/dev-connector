const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    // Find current user's profile based on JWT, then also bring in name/avatar from user model
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    // Throw error if no profile for the user
    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no profile associated with this user" });
    }

    // Else if there is a profile...
    res.json(profile);

    //
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private

router.post(
  "/",
  [
    auth,
    [
      // Check for status & skills
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills are required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // Check for errors - return them if so
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull all fields out of body
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object based on values entered
    const profileFields = {};

    // Get user based on current user (via JWT)
    profileFields.user = req.user.id;

    // Set fields based on user's input
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      // split based on comma, regardless of space after
      profileFields.skills = Array.isArray(skills)
        ? skills
        : skills.split(",").map((skill) => " " + skill.trim());
    }

    // Build social object
    profileFields.social = {};

    // Set social fields based on user's input
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      // Look for profile based on ID
      let profile = await Profile.findOne({ user: req.user.id });

      // If there is a profile, update it
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // If not already a profile, create it
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);

      //
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get("/", async (req, res) => {
  try {
    // Find profiles from profile model, & also populate with name/avatar from user model
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);

    //
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get("/user/:user_id", async (req, res) => {
  try {
    // Find profile from profile model based on their ID (from URL), & also populate with their name/avatar from user model
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    // If no profile for this user
    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    // Else, send result
    res.json(profile);

    //
  } catch (err) {
    console.error(err.message);
    // If invalid user ID entered, display same error as above
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/profile
// @desc    Delete user, their profile & their posts
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    // Delete user's posts
    await Post.deleteMany({ user: req.user.id });

    // Find profile based on ID (from JWT) and remove it
    await Profile.findOneAndRemove({ user: req.user.id });

    // Find user based on ID (from JWT) and remove it
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User deleted" });

    //
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
  "/experience",
  [
    auth,
    [
      // check fields have been entered
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "Start date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // Check for errors - show them if so
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull fields from body
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    // Create new experience based on above
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      // Find profile based on ID (from JWT)
      const profile = await Profile.findOne({ user: req.user.id });

      // Add experience (unshift = add to start of array)
      profile.experience.unshift(newExp);

      await profile.save();
      res.json(profile);

      //
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    // Find profile based on ID (from JWT)
    const profile = await Profile.findOne({ user: req.user.id });

    // Get index to remove from - based on experience ID from url
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    // Remove the experience from the array
    profile.experience.splice(removeIndex, 1);

    // Save and return updated profile
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
  "/education",
  [
    auth,
    [
      // check fields have been entered
      check("school", "School/college/university is required").not().isEmpty(),
      check("degree", "Level is required").not().isEmpty(),
      check("fieldofstudy", "Subject is required"),
      check("from", "Start date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // Check for errors - show them if so
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull fields from body
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    // Create new education based on above
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      // Find profile based on ID (from JWT)
      const profile = await Profile.findOne({ user: req.user.id });

      // Add education (unshift = add to start of array)
      profile.education.unshift(newEdu);

      await profile.save();
      res.json(profile);

      //
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete profile education
// @access  Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    // Find profile based on ID (from JWT)
    const profile = await Profile.findOne({ user: req.user.id });

    // Get index to remove from - based on education ID from url
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    // Remove the education from the array
    profile.education.splice(removeIndex, 1);

    // Save and return updated profile
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/profile/github/:username
// @desc    Get user's github repos
// @access  Public

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      // get repos - github username passed in from URL
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`,
      method: "GET",
      headers: {
        "user-agent": "node.js",
        Authorization: `token ${config.get("githubToken")}`,
      },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No Github profile found" });
      }

      // Else, return body
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
