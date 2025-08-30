import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const FileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  size: Number,
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaderUsername: String,
  uploadTime: { type: Date, default: Date.now },
  caption: {
    type: String,
    default: ''
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: { type: [CommentSchema], default: [] }
});

export default mongoose.model('File', FileSchema);