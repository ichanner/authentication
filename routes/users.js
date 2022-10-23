
var express = require('express');

var router = express.Router();


router.get('/:username', (req, res, next) => {

  console.log(req.app.locals.username);
  const users = req.app.locals.users;
  const username = req.params.username;



  if(username == req.app.locals.username){



  	users.findOne({ username }, (err, results) => {
  

    res.render('profile', { ...results, username });
  	

  	});

		
  }

  else{

  users.findOne({ username }, (err, results) => {

    if (err || !results) {

      res.render('public-profile', { messages: { error: ['User not found'] } });

    }

    res.render('public-profile', { ...results, username });
    
  });

}


})





module.exports = router;