const http = require('http');
const mysql = require('mysql');
const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
var app = express();

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '@mysql000',
    database: 'timetable',
    charset: 'utf8'
});


function setResHtml(sql, cb) {
    pool.getConnection((err, con) => {
        if (err) throw err;

        con.query(sql, (err, res, cols) => {
            if (err) throw err;

            return cb(res);
        });
    });
}

app.get('/', function(request, response) {
    response.redirect('/auth');
});

app.get('/auth', function(request, response) {
    response.render('./auth.ejs', { stat: 1 });
});

app.post('/auth', function(request, response) {
    var email = request.body.email;
    var password = request.body.password;
    if (email && password) {
        pool.query('SELECT * FROM login WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {

            if(error)
                throw error;
            else if (results.length > 0) {
                request.session.loggedin = true;
                request.session.email = email;
                response.redirect('/home');
            } 
            else {

                console.log("WRONG PASSWORD/email");
                response.send("error");

            }
            response.end();
        });
    } else {
        response.send('Please enter email and Password!');
        response.end();
    }
});

// app.get('/home', isLoggedIn, function(req, res) {
//     res.render('./home.ejs');
// });
app.get('/home', isLoggedIn, (req, res) => {
    setResHtml("SELECT *from classes", (responseData) => {
        res.render('./home.ejs', { data: responseData });
    });
});
app.post('/home', function(req, res) {
    var type = req.body.Type.toUpperCase();
    if (type === "TEACHER") {
        res.redirect('/teacher');
   
    } else if (type === "STUDENT") {
        res.redirect('/student');
    }
     else if (type === "LOGOUT") {
    res.redirect('/logout');
     }
     else if (type === "ADD_CLASSES") {
        res.redirect('/add_classes');
         }
    else if (type === "REMOVE_CLASSES") {
    res.redirect('/remove_classes');
        }
   

});
app.get('/add_classes',isLoggedIn, isLoggedIn, (req, res) => {
    res.render('./add_classes.ejs');
});

app.post('/add_classes',isLoggedIn, function (req, res) {

    var name= req.body.name;
    var date = req.body.date;
    var period = req.body.period;
  

    pool.query('insert into classes(name,date,period) values(?,?,?)', [name,date,period], function (error, results, fields) {
        if (error) console.log(error);
        res.redirect('/home');
    });
});

app.get('/remove_classes',isLoggedIn, isLoggedIn, (req, res) => {

    res.render('./remove_classes.ejs');
});

app.post('/remove_classes',isLoggedIn, function (req, res) {
    var name = req.body.name;
    var temp="delete from classes where name='"+name+"'";
    
    pool.query(temp, function (error, results, fields) {
        if (error) console.log(error);
        res.redirect('/home');
    });
});




app.get('/teacher', isLoggedIn, (req, res) => {
    setResHtml("SELECT *from teacher", (responseData) => {
        res.render('./teacher.ejs', { data: responseData });
    });
});
app.post('/teacher',isLoggedIn, function (req, res) {
    var type = req.body.update_teacher.toUpperCase();
    if (type === "REMOVE_TEACHER") {
        res.redirect('/remove_teacher');
    } else if (type === "ADD_TEACHER") {
        res.redirect('/add_teacher');
    }
});
app.get('/add_teacher',isLoggedIn, isLoggedIn, (req, res) => {
    res.render('./add_teacher.ejs');
});

app.post('/add_teacher',isLoggedIn, function (req, res) {

    var serial_num = req.body.serial_num;
    var name = req.body.name;
    var subject = req.body.subject;
  

    pool.query('insert into teacher(name,subject,serial_num) values(?,?,?)', [name,subject,serial_num], function (error, results, fields) {
        if (error) console.log(error);
        res.redirect('/teacher');
    });
});
app.get('/remove_teacher',isLoggedIn, isLoggedIn, (req, res) => {

    res.render('./remove_teacher.ejs');
});

app.post('/remove_teacher',isLoggedIn, function (req, res) {
    var serial_num = req.body.serial_num;
    pool.query('delete from teacher where serial_num='+serial_num + '', function (error, results, fields) {
        if (error) console.log(error);
        res.redirect('/teacher');
    });
});


app.get('/student', isLoggedIn, (req, res) => {
    setResHtml("SELECT *from student", (responseData) => {
        res.render('./student.ejs', { data: responseData });
    });
});

app.post('/student',isLoggedIn, function (req, res) {
    var type = req.body.update_student.toUpperCase();
    if (type === "REMOVE_STUDENT") {
        res.redirect('/remove_student');
    } else if (type === "ADD_STUDENT") {
        res.redirect('/add_student');
    }
});
app.get('/add_student',isLoggedIn, isLoggedIn, (req, res) => {
    res.render('./add_student.ejs');
});

app.post('/add_student',isLoggedIn, function (req, res) {

    var roll = req.body.roll;
    var name = req.body.name;
    var year = req.body.year;
    var branch = req.body.branch;

    pool.query('insert into student(roll,name,year,branch) values(?,?,?,?)', [roll,name,year,branch], function (error, results, fields) {
        if (error) console.log(error);
        res.redirect('/student');
    });
});
app.get('/remove_student',isLoggedIn, isLoggedIn, (req, res) => {

    res.render('./remove_student.ejs');
});

app.post('/remove_student',isLoggedIn, function (req, res) {
    var roll = req.body.roll;
    pool.query('delete from student where roll=' + roll + '', function (error, results, fields) {
        if (error) console.log(error);
        res.redirect('/student');
    });
});



app.get('/batch', isLoggedIn, (req, res) => {
    setResHtml("select * from student", (responseData) => {
        res.render('./batch.ejs', { data: responseData });
    });
});




app.get('/logout', isLoggedIn, (req, res) => {
    req.session.loggedin = false;
    res.redirect('/auth');
});


function isLoggedIn(req, res, next) {
    if (req.session.loggedin) {
        return next();
    }
    res.send("Not Logged In");
}

app.listen(3000, () => {
    console.log("Connected to 3000");
});
