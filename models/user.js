var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String, 
    password: String,
    firstname: String,
    lastname: String,
    year: String,
    linkedin: String,
    domain: String,
    reg: String,
    telnum: String,
    technical: String,
    corporate: String,
    creatives: String,
    github: String,
    branch: String,
    about: String,
    why: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    selected : {
        type : Boolean,
        default : false
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);
