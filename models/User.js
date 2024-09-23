const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

userSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered');
  console.log('Username:', this.username);
  console.log('Password (should be hashed):', this.password);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;