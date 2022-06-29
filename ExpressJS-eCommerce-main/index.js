const express = require("express")
const app = express()
// const handlebars = require('express-handlebars');
const path = require('path')
const mysql = require("mysql")
const dotenv = require("dotenv")
const bodyParser = require('body-parser')
const url = require('url')
var session = require('express-session')
const { message } = require("statuses")

dotenv.config({ path: './.env' })

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(
    session({
        secret: 'cat',
        resave: true,
        saveUninitialized: false,
    }),
);

app.use(function(req,res,next) {
    res.locals.session = req.session;
    next();
});

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE.PASSWORD,
    database: process.env.DATABASE
})

// const publicDir = path.join(__dirname,'./public')


db.connect( (err) => {
    if(err)
        console.log(err)
    else{
        let sql = "CREATE DATABASE IF NOT EXISTS nodejs_login;"
        
        db.query(sql, (err, res) => {
            if(err) throw err;
        })

        sql = "USE nodejs_login"
        db.query(sql, (err,res) =>{
            if(err) throw err;
        })

        sql = "SHOW TABLES LIKE 'user';"
            db.query(sql, (err, res) => {
                if (err) throw err;
                if(res.length > 0) return console.log('table existed');

                sql = 'CREATE TABLE \`user\` (\`id\` int AUTO_INCREMENT,email varchar(255),\`password\` varchar(255),name varchar(255),PRIMARY KEY(\`id\`));'
                db.query(sql, (err,res) =>{
                    if(err) throw err;
                })
            })

        console.log("Mysql connected...")
    }
})

// app.engine(
//     'hbs',
//     handlebars.engine({
//         extname: '.hbs', // change file types name
//         helpers: require('./helpers/handlebars'),
//     }),
// );

app.set('view engine', 'ejs')
app.set('views', './views');
// app.set('public','./views')
app.use(express.static(path.join(__dirname, 'public')));


app.get('/product', (req,res,next) => {
    if(!req.session.user){
        return res.redirect(url.format({
            pathname : "/login",
            query: {
                message: "You need to login first.",
                alert: "info"
            }
        }))
    }

    res.render("sanpham.ejs",{user: req.session.user})
})

app.get('/register', (req, res, next) => {
    
    let message = ''
    let alert = ''
    if(req.query.message) {
        message = req.query.message
        alert = req.query.alert
    }
    res.render("dangky.ejs",{message: message, alert: alert})
})

app.post('/register', (req, res, next) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const passwordRep = req.body.passwordrepeat

    let sql = `SELECT * FROM user WHERE email = \'${email}\';`
    db.query(sql, (err, result) => {
        if(err){
            console.log(err);
            throw err;
        }

        if(result.length > 0){
            return res.redirect(url.format({
                pathname: "/register",
                query: {
                    message : 'Email existed!',
                    alert: 'warning'
                }
            }))
        }

        if(password !== passwordRep){
            return res.redirect(url.format({
                pathname: "/register",
                query: {
                    message : 'Password not match',
                    alert: 'warning'
                }
            }))
        }
        //TODO: 2 password khac nhau, hien thuc o frontend

        db.query('INSERT INTO user SET ?' ,{
        name : name,
        email: email,
        password: password
        }, (err, result) => {
            if(err){
                console.log(err)
            }

            return res.redirect(url.format({
                pathname: '/login',
                query: {
                    message : 'User registered successfully',
                    alert: 'success'
                }
            }))

        })
    })
})

app.get('/login', (req, res, next) => {
    let message = ''
    let alert = ''
    if(req.query.message) {
        message = req.query.message
        alert = req.query.alert
    }
    res.render("dangnhap.ejs",{message: message, alert: alert})
})

app.post('/login', (req, res,next) => {
    // res.json(req.body)
    // console.log(req.params)
    const email = req.body.email;
    const password = req.body.psw;
    const sql = `SELECT * FROM user WHERE email = \'${email}\' AND password = \'${password}\';`;
    db.query(sql, (err, result) => {
        if(err) {
            console.log(err);
            throw err;
        }

       if(result.length == 0) return res.redirect(url.format({
           pathname: '/login',
           query : {
               message: "Wrong email or password",
               alert: "danger"
           }
       }))
        else{
            
            req.session.user = result[0];
            // console.log(req.session.user);
            res.redirect('/')
        }


    })
})

app.get('/logout', (req,res,next) => {
    if (req.session) {
            // delete session object
            req.session.destroy(function (err) {
                if (err) {
                    return next(err);
                } else {
                    return res.redirect('/');
                }
            });
        }
}) 

app.get('/', (req,res,next) => {
    res.render("trangchu.ejs",{user: req.session.user})
})


app.listen(3001, () => 
{console.log("App listen at https://localhost::3001")})