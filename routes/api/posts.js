const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");

// @route   POST api/posts
// @desc    Add a post
// @access  Private
router.post(
  "/",
  [auth, [check("text", "Post content is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    // Check for errors - return if so
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Else, create the new post
    try {
      // find the user based on ID (from JWT) - not the password
      const user = await User.findById(req.user.id).select("-password");

      // Create the post
      const newPost = new Post({
        text: req.body.text,
        // Get name/avatar from user model
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      // Save new post and return it
      const post = await newPost.save();
      res.json(post);

      //
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Get all posts and sort by most recent
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);

    //
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/posts/:id
// @desc    Get specific post
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    // Get post based on ID (from URL)
    const post = await Post.findById(req.params.id);

    // If not a post with that ID...
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Else return this post
    res.json(post);

    //
  } catch (err) {
    console.error(err.message);
    // If post ID entered is not a valid ID...
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete specific post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    // Find the post by ID (from URL)
    const post = await Post.findById(req.params.id);

    // If not a post with that ID...
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check the user owns the post they are trying to delete - if it doesn't...
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorised" });
    }

    // Else if the user does own the post
    await post.remove();
    res.json({ msg: "Post removed" });

    //
  } catch (err) {
    console.error(err.message);
    // If post ID entered is not a valid ID...
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server error");
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    // Find post by ID (from URL)
    const post = await Post.findById(req.params.id);

    // Check if the user has already liked the post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    // if they haven't, add user's like to beginning
    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    // Find post by ID (from URL)
    const post = await Post.findById(req.params.id);

    // Check if the post has been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // If it has been liked, get remove index (find correct like to remove)
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    // Remove the like
    post.likes.splice(removeIndex, 1);

    // Save and return
    await post.save();
    res.json(post.likes);

    //
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/posts/comment/:id
// @desc    Add comment to post
// @access  Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Comment is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    // Check for errors - return if so
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Else, add the comment
    try {
      // find the user based on ID (from JWT) - not the password
      const user = await User.findById(req.user.id).select("-password");
      // find the post based on ID (from URL)
      const post = await Post.findById(req.params.id);

      // Create the comment
      const newComment = {
        text: req.body.text,
        // Get name/avatar from user model
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      // Add comment to post (unshift = add to start)
      post.comments.unshift(newComment);

      // Save the post and return comments
      await post.save();
      res.json(post.comments);

      //
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    // find the post based on ID (from URL)
    const post = await Post.findById(req.params.id);

    // Find comment on this post (from URL) - will return the comment, or false if null
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // If no comment based on ID, throw error
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    // Check user owns comment they are deleting - if not...
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorised" });
    }

    // If they do own it, get remove index (find correct comment to remove)
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    // Remove the comment
    post.comments.splice(removeIndex, 1);

    // Save and return
    await post.save();
    res.json(post.comments);

    //
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
