const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'test', passwordHash })

  const savedUser = await user.save()

  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs.map(
    (blog) => new Blog({ ...blog, user: savedUser.id })
  )
  const promiseArray = blogObjects.map((blog) => blog.save())
  await Promise.all(promiseArray)
})

const getUser = async () => {
  const userResponse = await api
    .post('/api/login')
    .send({ username: 'test', password: 'sekret' })
  return userResponse.body
}

test('all blogs are returned - json format', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('correct id property', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body[0].id).toBeDefined()
})

test('save correctly', async () => {
  const newBlog = {
    title: 'Neovim pog',
    author: 'Michael Chan123',
    url: 'http://www.github.com/nvim',
    likes: 999,
  }
  const user = await getUser()

  await api
    .post('/api/blogs')
    .auth(user.token, { type: 'bearer' })
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogs = await helper.blogsInDb()
  expect(blogs).toHaveLength(helper.initialBlogs.length + 1)
})

test('likes default to 0', async () => {
  const newBlog = {
    title: 'Neovim pog',
    author: 'Michael Chan123',
    url: 'http://www.github.com/nvim',
  }

  const user = await getUser()

  const reponse = await api
    .post('/api/blogs')
    .auth(user.token, { type: 'bearer' })
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  expect(reponse.body.likes).toEqual(0)
})

test('title and url required', async () => {
  const newBlog = {
    author: 'Michael Chan123',
    url: 'http://www.github.com/nvim',
  }

  await api.post('/api/blogs').send(newBlog).expect(400)
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const user = await getUser()

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .auth(user.token, { type: 'bearer' })
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const contents = blogsAtEnd.map((r) => r.title)

    expect(contents).not.toContain(blogToDelete.title)
  })
})

describe('update of a blog', () => {
  test('succeeds and updates changed values', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const newBlog = {
      title: blogToUpdate.title,
      url: blogToUpdate.url,
      author: blogToUpdate.author,
      likes: 10,
    }
    console.log('blogs start', blogsAtStart)
    await api.put(`/api/blogs/${blogToUpdate.id}`).send(newBlog).expect(200)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    console.log('blogs end', blogsAtEnd)
    const updatedBlog = blogsAtEnd.find(
      (blog) => blog.title === blogToUpdate.title
    )
    console.log('updated blog', updatedBlog)
    expect(updatedBlog.likes).toEqual(newBlog.likes)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
