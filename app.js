var express = require('express');
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");


var passport = require("passport");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require('./user');
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var publicDir = require('path').join(__dirname,'/public'); 
app.use(express.static(publicDir)); 
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

// mongoose.connect("mongodb://localhost/users",{ useNewUrlParser: true ,useUnifiedTopology: true});
mongoose.connect("mongodb+srv://Devansh:Password@cluster0.qvgeg.mongodb.net/users?retryWrites=true&w=majority",{ useNewUrlParser: true ,useUnifiedTopology: true})
.then(() => console.log( 'Database Connected' ))
.catch(err => console.log( err ));

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

app.use(require("express-session")({
  secret: "hello hello",
  resave: false,
  saveUninitialized: false
}));


app.set("view engine", "ejs");

app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    next();
});

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new localStrategy(User.authenticate()));


var server_port = process.env.YOUR_PORT || process.env.PORT || 80;
var server_host = process.env.YOUR_HOST || '0.0.0.0';


app.get("/",(req,res)=>{
    res.render("home",{current: req.user,title:"Recruitments 20-21"});
  });

const isLoggedIn = (req,res,next) => {
    if(req.isAuthenticated()){
        return next();
    }
    else{
        
        res.redirect("/");
    }
}

app.get("/secret",isLoggedIn,(req,res)=>{


    res.render("secret",{name: req.user.firstname, github: req.user.github,current: req.user,title:"Recruitments 20-21"});
});

app.post("/secret",isLoggedIn,(req,res)=>{



    var applicant = {
        year: req.body.year,
        linkedin: req.body.linkedin,
        branch: req.body.branch,
        telnum: req.body.telnum,
        reg: req.body.reg,
        technical : req.body.techSub,
        corporate : req.body.corpSub,
        creatives : req.body.createSub,
        github : req.body.github,
        about: req.body.about,
        why: req.body.why
    }

    User.findOneAndUpdate({username: req.user.username},applicant,(err,user)=>{
        if(err){
            res.redirect("/secret");
        }
        else{
           console.log(user);
            res.redirect("/thanks");
        }
    })
   
});

app.get("/thanks",isLoggedIn,(req,res)=>{
  res.render("thanks",{current: req.user,title:"Thank You!"});
});

app.get("/register",(req,res)=>{
res.render("register",{current: req.user,title:"Register"});
});

app.get("/login",(req,res)=>{
  res.render("login",{current: req.user,title:"Login"});
  });
  

app.post("/register",(req,res)=>{
 User.register(new User({username: req.body.username, firstname: req.body.firstname, lastname: req.body.lastname}),req.body.password,(err,user)=>{
     if(err){
         console.log(err);
         res.redirect("/register");
     }
     else{
         passport.authenticate("local")(req,res,()=>{
            res.redirect("/rules");
         });
     }
 })
});

app.get("/rules",isLoggedIn,(req,res)=>{
res.render("rules",{current: req.user,title:"Rules"});
});



app.post("/login", passport.authenticate('local',{
    successRedirect:"/secret",
    failureRedirect:"/login"
}));


app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});

app.get('/forgot', function(req, res) {
    res.render('forgot',{current: req.user,title:"Forgot Password?"});
  });
  
  app.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ username: req.body.email }, function(err, user) {
          if (!user) {
            
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'codechefsrm@gmail.com',
            pass: "wwcxhxxgtfcowxle"
          }
        });
        var mailOptions = {
          to: user.username,
          from: 'codechefsrm@gmail.com',
          subject: 'Recruitment Portal Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });
  
  app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token,current:req.user,title:"Reset Password"});
    });
  });
  
  app.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'codechefsrm@gmail.com',
            pass: "wwcxhxxgtfcowxle"
          }
        });
        var mailOptions = {
          to: user.username,
          from: 'codechefsrm@gmail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/');
    });
  });


app.listen(server_port, server_host,()=>{
    console.log("Server Running on:" + server_host + "://" + server_port)
});