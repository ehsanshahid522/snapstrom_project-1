import Post from '../models/Post.js';
import User from '../models/User.js';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, image, isPublic = true } = req.body;
    const userId = req.user._id;

    const post = new Post({
      content,
      image,
      author: userId,
      isPublic
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    // Add post to user's posts array
    await User.findByIdAndUpdate(userId, {
      $push: { posts: post._id }
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        id: post._id,
        content: post.content,
        image: post.image,
        author: {
          id: post.author._id,
          username: post.author.username,
          profilePicture: post.author.profilePicture
        },
        likes: post.likes.length,
        comments: post.comments.length,
        shares: post.shares.length,
        isPublic: post.isPublic,
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
};

// Get all posts (feed)
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isPublic: true })
      .populate('author', 'username profilePicture')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username')
      .populate('shares.user', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedPosts = posts.map(post => ({
      id: post._id,
      content: post.content,
      image: post.image,
      author: {
        id: post.author._id,
        username: post.author.username,
        profilePicture: post.author.profilePicture
      },
      likes: post.likes.map(like => ({
        user: like.user.username,
        likedAt: like.likedAt
      })),
      comments: post.comments.map(comment => ({
        id: comment._id,
        user: comment.user.username,
        content: comment.content,
        createdAt: comment.createdAt
      })),
      shares: post.shares.map(share => ({
        user: share.user.username,
        sharedAt: share.sharedAt
      })),
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    res.json({
      success: true,
      posts: formattedPosts,
      hasMore: posts.length === limit
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .populate('author', 'username profilePicture')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username')
      .populate('shares.user', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedPosts = posts.map(post => ({
      id: post._id,
      content: post.content,
      image: post.image,
      author: {
        id: post.author._id,
        username: post.author.username,
        profilePicture: post.author.profilePicture
      },
      likes: post.likes.map(like => ({
        user: like.user.username,
        likedAt: like.likedAt
      })),
      comments: post.comments.map(comment => ({
        id: comment._id,
        user: comment.user.username,
        content: comment.content,
        createdAt: comment.createdAt
      })),
      shares: post.shares.map(share => ({
        user: share.user.username,
        sharedAt: share.sharedAt
      })),
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    res.json({
      success: true,
      posts: formattedPosts,
      hasMore: posts.length === limit
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts'
    });
  }
};

// Like/Unlike a post
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const existingLike = post.likes.find(like => like.user.toString() === userId.toString());

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(like => like.user.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push({ user: userId });
    }

    await post.save();

    res.json({
      success: true,
      message: existingLike ? 'Post unliked' : 'Post liked',
      likes: post.likes.length,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: userId,
      content
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.user', 'username');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        id: newComment._id,
        user: newComment.user.username,
        content: newComment.content,
        createdAt: newComment.createdAt
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// Share a post
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already shared by this user
    const existingShare = post.shares.find(share => share.user.toString() === userId.toString());
    if (existingShare) {
      return res.status(400).json({
        success: false,
        message: 'Post already shared'
      });
    }

    post.shares.push({ user: userId });
    await post.save();

    res.json({
      success: true,
      message: 'Post shared successfully',
      shares: post.shares.length
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share post'
    });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: postId, author: userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or unauthorized'
      });
    }

    await Post.findByIdAndDelete(postId);

    // Remove post from user's posts array
    await User.findByIdAndUpdate(userId, {
      $pull: { posts: postId }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};
