const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": {
    userID: 'userRandomID',
    url: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    userID: 'user2RandomID',
    url: "http://www.google.com"
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "user"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  '123': {
    id: '123',
    email: 'aa@aa.ca',
    password: 'bb'
  }
};



app.get('/', (req, res) => {
  let templateVars = {
    users: users,
    cookie: req.cookies
  }
  res.render('index', templateVars);
});

app.get('/registration', (req, res) => {
  let templateVars = {
    users: users,
    error: null
  };
  res.render('registration', templateVars);
});

app.get('/login', (req, res) => {
  let templateVars = {
    users: users,
    error: null
  }
  res.render('login', templateVars);
});

app.get('/urls', (req, res) => {
  const cookie = req.cookies;
  //Filter through database to display only a users urls
  const userURLS = urlsForUser(cookie.user_id);
  let templateVars = { 
    urls: userURLS,
    users: users,
    cookie: cookie,
    error: null
  };
  if (cookie.user_id) {
    res.render('urls_index', templateVars);
  } else {
    res.status(403).render('login', { error: 'You must be logged in to access the URLs.' })
  }
});

app.get('/urls/new', (req, res) => {
  const cookie = req.cookies;
  let templateVars = {
    users: users,
    cookie: cookie
  };
  if (cookie.user_id) {
    res.render('urls_new', templateVars);
  } else {
    res.status(403).render('login', { error: 'You must be logged in to add new URLS.' });
  }
});

app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const cookie = req.cookies;
  const userURLS = urlsForUser(cookie.user_id);
  let templateVars = { 
    shortURL: shortURL,
    longURL: urlDatabase[req.params.id].url,
    users: users,
    cookie: cookie,
    urls: userURLS,
    error: null
  };

  if (!cookie.user_id) {
    // Not logged in
    res.status(403).render('login', { error: 'You need to be logged in to view that page.' });
  } else if (cookie.user_id === urlDatabase[shortURL].userID) {
    // Logged in and url belongs to user
    res.render('urls_show', templateVars)
  } else {
    // Url does not belong to user, return them to their list of URLS with an error message
    templateVars.error = 'You do not have permission to access that URL.';
    res.status(403).render('urls_index', templateVars);
  }
});

app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;

  // check to make sure shortURL is valid
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.send('Incorrect URL');
  }
  let longURL = urlDatabase[shortURL].url;
  res.redirect(longURL);
});

//
// ---------------- POSTS -----------------
//

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { userID: req.cookies.user_id, url: longURL };
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  const shortURL = req.params.id;
  if (req.cookies.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
  }
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].url = longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let id = '';
  for (var i in users) {
    if (users[i].email !== email) {
      // Not a match, skip to next user
      continue;
    } else {
      // Found match
      if (users[i].password === password) {
        id = users[i].id;
        res.cookie('user_id', id);
        return res.redirect('/urls');
      } else {
        return res.status(403).render('login', { error: 'Password incorrect.' });
      }
    }
  }
  return res.status(403).render('login', { error: 'Email incorrect.' });
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/');
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  // Check to make sure fields are not empty
  if (email === '' || password === '') {
    return res.status(400).render('registration', { error: 'Email or password was left blank.' });
  }

  users[id] = {
    id: id,
    email: email,
    password: password
  };
  res.cookie('user_id', id);
  res.redirect('/urls')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}`);
});


function generateRandomString() {
  let newString = '';
  const strLength = 6;
  const characters = [
    numbers = { min: 48, max: 57 },
    upperCase = { min: 65, max: 90 },
    lowerCase = { min: 97, max: 122 }
  ];

  for (let i = 0; i < strLength; i++) {
    const randomIndex = Math.floor(Math.random() * Math.floor(3));
    const min = characters[randomIndex].min;
    const max = characters[randomIndex].max;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    newString += String.fromCharCode(code);
  }
  return newString;
}

function urlsForUser(id) {
  let userURLS = {};
  for (var i in urlDatabase) {
    if (urlDatabase[i].userID === id) {
      userURLS[i] = {
        userID: id,
        url: urlDatabase[i].url
      };
    }
  }
  return userURLS;
}