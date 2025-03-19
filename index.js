const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { connectToDatabase, getCollection } = require("./db");

const app = express();
app.use(bodyParser.json());

// Connect to database
connectToDatabase();

// Load data from JSONPlaceholder
app.get("/load", async (req, res) => {
  try {
    const userCollection = getCollection("users");
    const postCollection = getCollection("posts");
    const commentCollection = getCollection("comments");

    // Fetch users
    const { data: users } = await axios.get("https://jsonplaceholder.typicode.com/users");

    for (const user of users) {
      const { data: posts } = await axios.get(`https://jsonplaceholder.typicode.com/posts?userId=${user.id}`);
      const userPosts = [];
      const postComments = [];

      for (const post of posts) {
        const { data: comments } = await axios.get(`https://jsonplaceholder.typicode.com/comments?postId=${post.id}`);
        postComments.push(...comments);
        userPosts.push(post);
      }

      await userCollection.insertOne(user);
      await postCollection.insertMany(userPosts);
      await commentCollection.insertMany(postComments);
    }

    res.status(200).send();
  } catch (error) {
    console.error("Error loading data:", error);
    res.status(500).send({ error: "Failed to load data" });
  }
});

// Delete all users
app.delete("/users", async (req, res) => {
  try {
    const userCollection = getCollection("users");
    await userCollection.deleteMany({});
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).send({ error: "Failed to delete users" });
  }
});

// Delete user by ID
app.delete("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userCollection = getCollection("users");
    const result = await userCollection.deleteOne({ id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({ error: "Failed to delete user" });
  }
});

// Get user by ID
app.get("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userCollection = getCollection("users");
    const postCollection = getCollection("posts");
    const commentCollection = getCollection("comments");

    const user = await userCollection.findOne({ id: userId });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const posts = await postCollection.find({ userId }).toArray();
    for (const post of posts) {
      post.comments = await commentCollection.find({ postId: post.id }).toArray();
    }

    user.posts = posts;

    res.status(200).send(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send({ error: "Failed to fetch user" });
  }
});

// Add new user
app.put("/users", async (req, res) => {
  try {
    const userCollection = getCollection("users");
    const newUser = req.body;

    const existingUser = await userCollection.findOne({ id: newUser.id });
    if (existingUser) {
      return res.status(409).send({ error: "User already exists" });
    }

    await userCollection.insertOne(newUser);
    res.status(201).location(`/users/${newUser.id}`).send();
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
