import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const FileSchema = new mongoose.Schema({
  // File metadata
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  
  // Post information
  caption: {
    type: String,
    default: '',
    maxlength: 1000,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  // User information
  uploader: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  uploaderUsername: {
    type: String,
    required: true
  },
  
  // Social interactions
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  comments: { 
    type: [CommentSchema], 
    default: [] 
  },
  
  // Metadata
  uploadTime: { 
    type: Date, 
    default: Date.now 
  },
  
  // Processing status
  processed: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Indexes for performance
FileSchema.index({ uploader: 1, uploadTime: -1 });
FileSchema.index({ isPrivate: 1, uploadTime: -1 });
FileSchema.index({ tags: 1 });
FileSchema.index({ likes: 1 });
FileSchema.index({ uploadTime: -1 });

// Text search index
FileSchema.index({
  caption: 'text',
  tags: 'text'
}, {
  weights: {
    caption: 10,
    tags: 5
  }
});

// Virtual for like count
FileSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
FileSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtuals are included in JSON output
FileSchema.set('toJSON', { virtuals: true });
FileSchema.set('toObject', { virtuals: true });

export default mongoose.model('File', FileSchema);