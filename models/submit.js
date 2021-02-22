var mongoose = require("mongoose");


var submitSchema = new mongoose.Schema({
   email: String,
   firstname: String,
   lastname: String,
   telnum: String,
   submission: String,
   linkedin: String,
   year: String,
   technical : String,
   corporate : String,
   creatives : String
});



module.exports = mongoose.model("Task",submitSchema);
