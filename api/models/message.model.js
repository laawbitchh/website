const mongoose = require("mongoose");

var schema = mongoose.Schema({
  from: String,
  to: String,
  content: String,
  sendAt: Date,
});

module.exports = mongoose.model("convs", schema);
