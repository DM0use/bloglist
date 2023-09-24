const _ = require('lodash')

const dummy = (blogs) => {
  // ...
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, person) => {
    return (sum += person.likes)
  }, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const objectWithMaxLikes = blogs.reduce((maxLikesObject, currentObject) => {
    if (currentObject.likes > maxLikesObject.likes) {
      return currentObject
    }
    return maxLikesObject
  })

  const { title, author, likes } = objectWithMaxLikes
  return { title, author, likes }
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const authorCounts = _.countBy(blogs, 'author')

  const authorWithMostBlogs = _.maxBy(
    Object.keys(authorCounts),
    (author) => authorCounts[author]
  )

  return {
    author: authorWithMostBlogs,
    blogs: authorCounts[authorWithMostBlogs],
  }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const authorLikes = {}

  blogs.forEach((blog) => {
    if (authorLikes[blog.author]) {
      authorLikes[blog.author] += blog.likes
    } else {
      authorLikes[blog.author] = blog.likes
    }
  })

  const authorWithMostLikes = _.maxBy(
    _.keys(authorLikes),
    (a) => authorLikes[a]
  )

  return {
    author: authorWithMostLikes,
    likes: authorLikes[authorWithMostLikes],
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
