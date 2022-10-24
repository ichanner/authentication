/*
MegaTowel Server version 1.1
todo:
-More url params
-Expire mid-way access tokens
*/


require('dotenv').config()
const hbs = require('hbs');
const express = require('express')
const bcrypt = require('bcrypt')
const session = require('express-session')
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');


const app = express()
const port = 3000;
app.listen(port, function () {

    console.log(new Date() + " MegaTowelIO > listening on port " + port);

});


app.use(bodyParser.urlencoded({ extended: true }));
var Authorized = false;



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use('/', indexRouter);
app.use('/users', usersRouter);


const router = express.Router();
app.use(express.static(__dirname + 'public'));

router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

router.get('/register', function (req, res) {
    res.sendFile(path.join(__dirname + '/register.html'));
});


router.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname + '/login.html'));
});


router.get('/AccountTermination', function (req, res) {
    res.sendFile(path.join(__dirname + '/AccountTermination.html'));
});


router.get('/public/images', function (req, res) {
    res.sendFile(path.join(__dirname + '/images'));
});

router.get('/Profile', function (req, res) {
    res.sendFile(path.join(__dirname + '/Profile.html'));
});

router.get('/auth', function (req, res) {
    res.sendFile(path.join(__dirname + '/auth.html'));
});
/*
app.use(function(req,res,next){

    res.status(404).send("Bruh");
})
*/
app.get('/api', (res, req) => {

    console.log("Hello from MegaTowel API");

});

app.use(session({
    secret: process.env.SESSION_SECRET, saveUninitialized: true,
    resave: true
}))


app.use(router);
//Connection to db
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {

    if (err) throw err;

    var dbo = db.db("Hyrize-Players"); //Account api

    const users = dbo.collection('Accounts');
    app.locals.users = users;

    app.post('/register', async (req, res) => {


        try {
            var hashedPassword = await bcrypt.hash(req.body.password, 10);
            date = new Date();

           // var users = dbo.collection("Accounts").find();

            var data = { id: Date.now().toString(), username: req.body.username, password: hashedPassword, email: req.body.email, Avatar:"images/Default.png", tag: req.body.username, bio: "This user hasn't written a bio", day: date.getDate(), month: date.getMonth()+1, year: date.getFullYear(), Reputation: 
            "New User", Notifications_On: false, verrified: true, Banned: false, TwoFactorAuthed: false, Honor_Badge: false, Status: "Offline", Is_Dev: false, Is_Support: false, Is_Deleted: false};
           
            res.redirect('/login');
            dbo.collection("Accounts").insertOne(data, function (err, res) {

                if (err) throw err;
                //db.close();

            });
        }
        catch{

            res.redirect('/login');
        }

    });


    app.post('/logout', (req, res) => {

        req.session.destroy();
        app.locals.username = null;

        var dbo = db.db("Blacklisted-Tokens");

        var tokens = { refresh_token: req.body.refresh, access_token: req.body.access };

        dbo.collection("Tokens").insertOne(tokens, function (err, res) {

            if (err) throw err;
        });

    });


    app.post('/login', async (req, res) => {


        dbo.collection("Accounts").find({}).toArray(function (err, result) {
            if (err) throw err;

            const { username, password } = req.body;

            if (username && password) {

                const user = result.find(
                    user => user.username === username


                )

                req.session.user = user;
                req.session.authorized = false;

                if (user && user.Is_Deleted == false) {

                      console.log(user);

                    bcrypt.compare(req.body.password, user.password, function (err, res) {

                        if (err) {

                        }

                        if (res) {

                            console.log(user.username + " Was just authorized at " + new Date());

                            console.log(req.sessionID);

                            req.session.authorized = true;

                            req.session.ide = user.id;


                            app.locals.username = user.username;



                        }

                        else {



                        }


                    });

                }


               

                function checkHash() {

                    const is_authorized = req.session.authorized;

                    const id_user = req.session.ide;

                    if (is_authorized == true) {


                        //shit - make one function
                        jwt.sign({ id_user }, process.env.REFRESH_SECRET, { expiresIn: '86400s' }, (err, refresh_token) => {


                            //console.log(refresh_token);

                            req.session.refresh_token = refresh_token;

                        });

                        jwt.sign({ id_user }, process.env.ACCESS_SECRET, { expiresIn: '3600s' }, (err, token) => {


                            //console.log(user);
                            const refresh = req.session.refresh_token;
                         

                            res.redirect('/auth?token=' + token + '&refresh=' + refresh);
                        });

                    }
                }
            }
        })

    })




    app.post('/refreshToken', Authenticate_Refresh, (req, res) => {



        const id_user = req.session.ide;

        var dbo = db.db("Blacklisted-Tokens");

        var last_token = req.body.access2;

        var tokens = {access_token: "Bearer "+last_token};

        console.log(last_token);

        dbo.collection("Tokens").insertOne(tokens, function (err, res) {

               if (err) throw err;
        });


        jwt.verify(req.refresh_token, process.env.REFRESH_SECRET, (err, Data) => {

            if (err) {

                res.sendStatus(403);
            }

            else {


                const user = req.session.user;
            
                jwt.sign({ id_user }, process.env.ACCESS_SECRET, { expiresIn: '3600s' }, (err, token) => {


                    res.json({

                        token
                    });



                });


            }

        })

    })



    app.post('/test',(req,res)=>{

        
        var dbo = db.db("Hyrize-Players");
        console.log(req.session.ide);

        var query = {id: req.session.ide};
        dbo.collection("Accounts").find(query).toArray(function(req,use){

             if (err) {

                
            }
            else{



                res.json({

                    use
                })

            }
            
                                
        })
    })


    app.post('/api/posts', Authenticate, (req, res) => {


        jwt.verify(req.token, process.env.ACCESS_SECRET, (err, Data) => {

            if (err) {

                res.sendStatus(403);
            }
            else {

                res.json({

                    Data


                })

            }

        })

    })


    app.post('/updateProfile',(req,res)=>{

        var dbo = db.db("Hyrize-Players");
        var query = {id: req.session.ide};
        var newname = {$set: {username: req.body.newname}};
        dbo.collection("Accounts").updateOne(query,newname,function(err,res){

            if (err) throw err;
        });

        
    });



    app.post('/updateBio',(req,res)=>{

        var dbo = db.db("Hyrize-Players");
        var query = {id: req.session.ide};
        var newbio = {$set: {bio: req.body.newbio}};
        dbo.collection("Accounts").updateOne(query,newbio,function(err,res){

            if (err) throw err;
        });
    
    });


    app.post('/updateEmail', (req,res)=>{

        

    });



    app.post('/updatePassword',async (req,res)=>{


        var dbo = db.db("Hyrize-Players");

       dbo.collection("Accounts").find({}).toArray(function (err, result) {
           
            if (err) throw err;

            const user = result.find(user => user.id === req.session.ide)


        var test = req.body.oldpass;

            console.log(user);
            console.log(user.password);

        bcrypt.compare(test, user.password, function (err, res) {

            if(res){

                req.session.can_change = true;
                console.log("passwords matched");
            }

        });


    });

    setTimeout(checkHash, 3000); 

    async function checkHash() {


        if(req.session.can_change == true){

            try {

                var query = {id: req.session.ide};
            
                var hashedPassword = await bcrypt.hash(req.body.newpass, 10);

                var newpass = {$set: {password: hashedPassword}};

                dbo.collection("Accounts").updateOne(query,newpass,function(err,res){

                    if (err) throw err;
                });

            }
        
            catch{


            }

        }

    }
    
});







app.post('/delete',(req,res)=>{


        var dbo = db.db("Hyrize-Players");

        var feedback = {feedback: req.body.reason};

        dbo.collection("Reason for Deleting").insertOne(feedback, function (err, res) {

            if (err) throw err;
        });

       dbo.collection("Accounts").find({}).toArray(function (err, result) {
           
            if (err) throw err;

            const user = result.find(user => user.id === req.session.ide)


        var test = req.body.pass;

            console.log(user);
            console.log(user.password);

        bcrypt.compare(test, user.password, function (err, res) {

            if(res){

                req.session.can_delete = true;
                console.log("Can delete");
            }

        });


    });

    setTimeout(checkHash, 3000); 

    async function checkHash() {


            if(req.session.can_delete == true){


            var query = {id: req.session.ide};

            var set_Deleted = {$set: {username: "Deleted User "+Date.now().toString(), email:"",bio:"", Avatar:"images/Default.png", tag: "Deleted User "+Date.now().toString(),day: 0, month: 0, year: 0, Reputation: 
            "", Notifications_On: false, Verrified: false, Banned: false, TwoFactorAuthed: false, Honor_Badge: false, Status:"Offline", Is_Dev: false, Is_Support: false, Is_Deleted: true}};
        
            dbo.collection("Accounts").updateOne(query,set_Deleted ,function(err,res){
   
                    if (err) throw err;

            });
      

        };

    }

})


    

    module.exports = app;



    function Authenticate(req, res, next) {

        const bearerHeader = req.headers['authorization'];

        if (typeof bearerHeader !== 'undefined') {

            const bearer = bearerHeader.split(' ');

            const bearerToken = bearer[1];

            req.token = bearerToken;

            var query = { access_token: "Bearer " + req.token };
            var dbo = db.db("Blacklisted-Tokens");
            dbo.collection("Tokens").find(query).toArray(function (err, result) {

                if (result.length == 0) {
                    next();

                } else {
                    res.sendStatus(403);
                }
            })

        };

    };

    function Authenticate_Refresh(req, res, next) {


        const bearerHeader = req.headers['refresh'];

        if (typeof bearerHeader !== 'undefined') {

            const bearer = bearerHeader.split(' ');

            const bearerToken = bearer[1];

            req.refresh_token = bearerToken;

            var query = { refresh_token: "Bearer " + req.refresh_token };
            var dbo = db.db("Blacklisted-Tokens");

            dbo.collection("Tokens").find(query).toArray(function (err, result) {

                if (result.length == 0) {

                    next();
                }

                else {
                    res.sendStatus(403);
                }

            })

        };

    };


});

