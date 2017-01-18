var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var ig = require('instagram-node').instagram();

ig.use({ client_id: '7c6f8b01fc0843beabee429279fdac3c',
         client_secret: 'c309e2647ecf4cb4b6daa1ea5814b456'});

var redirect_uri = 'http://localhost:3000/handleauth';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Express session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

//Connect Flash
app.use(flash());

//Global variables
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);

  // if(req.session.accesstoken && req.session.accesstoken != 'undefined'){
  //   res.locals.isLoggedIn = true;
  // } else {
  //   res.locals.isLoggedIn = false;
  // }

  next();
});

//Home route
app.get('/', function(req, res){
  res.render('index', {
    title: 'InstaPics'
  })
});

//Login Route
app.get('/login', function(req, res){
  res.redirect(ig.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
});

//Handle Auth Route
app.get('/handleauth', function(req, res){
  ig.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("Didn't work");
    } else {
      req.session.accesstoken = result.access_token;
      req.session.uid = result.user.id;
      ig.use({access_token: req.session.accesstoken});

      res.redirect('/main');
    }
  });
});

//Main Route
app.get('/main', function(req, res){
  ig.user(req.session.uid, function(err, result, remaining, limit){
    if(err){
      res.send(err);
    } else {
      ig.user_self_feed(function(err, medias, pagination, remaining, limit){
        res.send(medias);
        // res.render('main',{
        //   title: 'Main Instagram Feed',
        //   user: result,
        //   medias: medias
        // })
      });
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
