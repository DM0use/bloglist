const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", {
    username: 1,
    name: 1,
  });
  response.json(blogs);
});

blogsRouter.post("/", async (request, response) => {
  if (!request.body.title || !request.body.url) {
    response.status(400).json({ error: "Title and url must be providfed" });
  } else {
    if (!request.user.id) {
      return response.status(401).json({ error: "token invalid" });
    }

    const blog = new Blog(request.body);

    const user = await User.findOne({ _id: request.user.id });
    blog.user = user._id;

    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();
    response.status(201).json(savedBlog);
  }
});

blogsRouter.delete("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (blog.user.toString() != request.user.id) {
    return response.status(401).json({ error: "token invalid" });
  }

  await Blog.findByIdAndRemove(request.params.id);
  response.status(204).end();
});

blogsRouter.put("/:id", async (request, response) => {
  const { title, url, author, likes } = request.body;
  const blog = {
    title,
    url,
    author,
    likes,
  };
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });

  response.json(updatedBlog);
});

module.exports = blogsRouter;
