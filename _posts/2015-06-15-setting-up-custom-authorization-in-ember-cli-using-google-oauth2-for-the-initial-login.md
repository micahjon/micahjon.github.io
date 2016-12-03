---
title: Setting up Custom Authorization in Ember-CLI using Google oAuth2 for the Initial
  Login
date: 2015-06-15 09:32:00 -04:00
description: A simple full-stack authorization demo using Ember-CLI, Ember Simple
  Auth, Torii, and Express.
redirect_from: "/setting-up-custom-authorization-in-ember-cli-using-google-oauth2-for-the-initial-login/"
---

I've found it handy in Ember-CLI apps to use Google logins for initial authentication (that way I don't have to store passwords). The question is how to transform a Google login into a session that can be used to query user-specific resources from my own server (not just Google's APIs). Here's a high level view of the process:

*   **User** logs in to their Google account, and authorizes Ember **app**. _In this process the app receives a Google token._
*   **App **sends Google token to the node **server** in response for a new token. _The server validates the Google token and then uses it to get user info from Google. It then creates a new custom token containing a user id, which it sends to the app._
*   **App **uses it's new custom token in all further requests to the **server**. _Right before this token expires, it will be refreshed._

In this process, _token _refers to a JSON web token. We'll be using the following open-source projects to build a basic app (for the finished product, [see my GitHub repo](https://github.com/pranksinatra/basic-auth-demo)).

### Ember Client:

1.  [Ember-Cli](http://www.ember-cli.com/)
2.  [Ember Simple Auth](http://ember-simple-auth.com/) and [Ember CLI Simple Auth Token](https://github.com/jpadilla/ember-cli-simple-auth-token) extension
3.  [Torii](http://vestorly.github.io/torii/) Google Oauth2 Bearer provider

### Node Server:

1.  [Express](http://expressjs.com/) for creating REST API routes
2.  [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) and [express-jwt](https://github.com/auth0/express-jwt) for encoding and decoding JSON web tokens
3.  [request](https://github.com/request/request) for talking with Google's APIs
4.  [bodyParser](https://github.com/expressjs/body-parser) for extracting the body (data) from the app's requests.

## Step 1: Setup Ember-CLI app structure

Create a simple folder structure:

<pre>
basic-auth-demo
    ember-client
    node-server
</pre>

Instead of actually making an "ember-client" folder, just run:

```bash
ember new ember-client
```

within the _basic-auth-demo_ folder. Then we'll set up the following route structure:

```bash
ember g route s
ember g route s/notes
```

The idea is that any subroute of s (for "secure") will be protected from public access by a Google login. Ember Simple Auth has some mixins that make this a synch. Initially, I'll set up some really basic templates to keep track of our nested routes.

```handlebars
{% raw %}
<h2 id="title">Welcome to Ember.js</h2>

{{#if session.isAuthenticated}}
 <a {{ action 'invalidateSession' }}>Logout</a>
{{else}}
 <a {{ action 'sessionRequiresAuthentication' }}>Login</a>
{{/if}}

{{outlet}}
{% endraw %}
```

```handlebars
{% raw %}
<!-- s.hbs template -->

<hr>This is a secure route.<hr>

{{outlet}}
{% endraw %}
```

```handlebars
{% raw %}
<!-- s/notes.hbs route -->

<p>A list of secure notes...</p>

{{outlet}}
{% endraw %}
```

Then if you run `ember s` and navigate to _localhost:4200/s/notes_ you should see something like this: 

![Ember notes route](http://micahjon.com/wp-content/uploads/2015/07/Screenshot-from-2015-07-17-221808-300x204.png)

## Step 2: Setup node server to return tokens

In the _node-server_ folder, create a _server.js_ file. 

```javascript
// express framework for routing
var express = require('express');
 
// create and validate json web tokens
var createJWT = require('jsonwebtoken');
var validateJWT = require('express-jwt');
```

Then setup a node project with `npm init` (it creates a package.json to track dependencies--you can just press Enter at the prompts)

```bash
cd node-server
npm init
```

and install the modules we required in _server.js_.

```bash
npm install express --save
npm install jsonwebtoken --save
npm install express-jwt --save
```

Great, now you can try to run your node server!

```bash
node server
```

If nothing happened, that's a good thing. It means there were no errors. Now let's actually set up the node server that listens on port 4500\. Add these lines to _server.js_ 

```javascript
// startup and listen on port 4500
var app = express();
app.listen('4500');
 
// setup HTTP headers
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Content-Type', 'application/json');
    next();
});
 
// respond with "yolo" to a GET request to the root (localhost:4500)
app.get('/', function (req, res) {
    res.send('yolo');
}); 
```

This time when your run `node server` it should pause (until you hit Ctrl-C) b/c it's listening to port 4500\. Try going to _localhost:4500_ in your browser and you should see "yolo". 

![Node serves up "yolo" at root](http://micahjon.com/wp-content/uploads/2015/07/Screenshot-from-2015-07-17-224142.png) 

We can use this same syntax to respond to Ember when it requests a json web token with a POST request. Add the following to _server.js_ to serve up a token when a POST request is sent to _localhost:4500/get-token_. 

```javascript
// respond w/ token to POST request to /get-token
app.post('/get-token', function (req, res) {
    var token = createJWT.sign(
        // payload
        { currentUserId: 1 },
        // secret
        '09htfahpkc0qyw4ukrtag0gy20ktarpkcasht',
        // options
        { expiresInMinutes: 10 }
    );
    res.send({ token: token });
    console.log('\tsent token');
});
```

Now, use a browser extension like [Postman for Chrome](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop) to send a POST request to _localhost:4500/get-token_. You'll need to restart the server (ctrl-c, then `node server` again) first to incorporate the new code or you'll get a "Cannot POST /get-token" error. 

![Sending POST request to fetch token w/ Postman](http://micahjon.com/wp-content/uploads/2015/07/Screenshot-from-2015-07-17-225619.png) 

_Just for fun: to get a good grasp of what the token actually stores, paste it into the [jwt.io](http://jwt.io/)._

## Step 3: Hook up Ember Simple Auth with node server

Install [Ember Simple Auth](http://ember-simple-auth.com/) and [its token-based extension](https://github.com/jpadilla/ember-cli-simple-auth-token).

```bash
cd ../ember-client
ember install ember-cli-simple-auth
ember install ember-cli-simple-auth-token
```

_Tip: I generally find it best to open up two terminal tabs open so I can have `node server` running while I work in Ember_ Then let's create an adapter so Ember knows where it's API server is:

```bash
ember g adapter application
```

```javascript
// application.js adapter
 
import DS from 'ember-data';
 
export default DS.RESTAdapter.extend({
    host: 'http://localhost:4500'
});
```

And setup the authentication addons by adding the following properties to _ENV_ in _config/environment.js_: 

```javascript
contentSecurityPolicy: {
  'connect-src': "'self' http://localhost:4500",
},
 
'simple-auth-token': {
  serverTokenEndpoint: 'http://localhost:4500/get-token',
},
 
'simple-auth': {
  authorizer: 'simple-auth-authorizer:token'
}
```

Great, now we'll setup _s_ as a protected route and handle authentication in the _application_ route. 

```javascript
// s (secure) route
 
import Ember from 'ember';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';
 
export default Ember.Route.extend(AuthenticatedRouteMixin, {
});
```

_Note: I had to manually create an application.js file in app/routes_ 

```javascript
// application route
 
import Ember from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';
 
export default Ember.Route.extend(ApplicationRouteMixin, {
    actions: {
        sessionRequiresAuthentication: function() {
            this.get('session')
                .authenticate('simple-auth-authenticator:jwt', { password: ''} )
                .then(function(){
                    console.log('custom token authentication successful!');
                }, function (error) {
                    console.log('custom token authentication failed!', error);
                });
        }
    }
});
```

Assuming that both `ember s` and `node server` are running, you should now be able to log in and out of your Ember application and only access /s/ routes when logged in. At this point there is still no real security. Anonymous users are handed tokens willy-nilly, but it's a good start.

## Step 4: Setting up Google Account logins

It may be tempting at this point to use a the Google oAuth2 Torii provider bundled into the [Ember Simple Auth Torii](https://github.com/simplabs/ember-simple-auth/tree/master/packages/ember-simple-auth-torii) extension, and simply authenticate with Google and right before authenticating w/ our node server. The problem is that upon authentication, Ember Simple Auth lets the user access secure routes. In other words, /s/notes can be transitioned to _before_ the second authentication with our node server happens and an authorizer is actually set up. I imagine there is a workaround to this problem but I found it simpler to just use Torri providers directly w/out the authenticator wrapper.

```bash
ember install torii
```

You can setup the Google oAuth2 Bearer provider by adding a _torii _property to _ENV_ in _environment.js_. 

```javascript
torii: {
      providers: {
        'google-oauth2-bearer': {
          apiKey: '10514958320583-as0utyahvaekgprntiashtoasht.apps.googleusercontent.com',
          redirectUri: 'http://localhost:4200',
        },
      }
    }
```

To get an _apiKey_, go to the [Google Developer Console](https://console.developers.google.com/project) and create a new project. Click on _Credentials _under _APIs & auth _in the left side nav and select _Create new Client ID_ under _OAuth_, choosing _Web Application_ in the popup. (You may need to _Configure the consent screen_ first--just enter the _Product Name_ and click _Save_). Now, in the popup, enter _http://localhost:4200_ in both fields (_authorized javascript origins_ and _authorized redirect uri_). The first requires an actual domain and the second doesn’t need to redirect to any particular Ember route since Ember will handle this on it’s own. Copy the _Client ID _string, and past it into _environment.js_ as (you guessed it) the _apiKey_. At this point, we just need to set up the Application route to log in with Google first and then send the Google token to the node server for custom authentication. Making a few minor edits to _sessionRequiresAuthentication_: 

```javascript
sessionRequiresAuthentication: function() {
    var session = this.get('session');
    this.get('torii')
        .open('google-oauth2-bearer')
        .then(function(googleAuth){
            var googleToken = googleAuth.authorizationToken.access_token;
            console.log('Google authentication successful.');
 
            session
                .authenticate('simple-auth-authenticator:jwt', { password: googleToken} )
                .then(function(){
                    console.log('custom token authentication successful!');
                }, function (error) {
                    console.log('custom token authentication failed!', error.message);
                });
 
        }, function (error) {
            console.error('Google auth failed: ', error.message);
        });
}
```

Notice how I pass _googleToken_ to the node server as a _password._ Now, we just need to set up the node server to parse this token, fetch the current user from Google, and return an user-identifying token that can be used for authorizing secure resources. If everything is working, when you click on _Login _you should see a _Request for Permission _popup from Google. 

![Google login](http://micahjon.com/wp-content/uploads/2015/07/Screenshot-from-2015-07-18-001347-300x274.png)

## Step 5: Fetching user info from Google

In _server.js_, instead of just returning a token, we must first [validate the Google token](https://developers.google.com/identity/protocols/OAuth2UserAgent#validatetoken) against Google's API. In this process, Google will send back a unique user id and an email address. We can also call the Google+ People API to get additional data, such as the displayName and image. All of this information can then be used to create/update/find the current user in our backend database and return a unique token, which contains a valid user id, to Ember. The `{password: googleToken}` object is passed to the server as JSON in the body of the POST request. To get it, we'll need to install the [body-parser middleware](https://github.com/expressjs/body-parser). We'll also install the [request](https://github.com/request/request) library to make a server-side request to Google.

```bash
cd ../node-server
npm install body-parser --save
npm install request --save
```

and then at the top of _server.js_: 

```javascript
// decodes json in the body of a request and stores it as req.body
var bodyParser = require('body-parser');
 
// simple HTTP request client
var request = require('request');
```

The next step is simply expanding `app.post('/get-token')` to [validate the token](https://developers.google.com/identity/protocols/OAuth2UserAgent#validatetoken). 

```javascript
// secret used to construct json web token
app.secret = '09htfahpkc0qyw4ukrtag0gy20ktarpkcasht';
 
// send token to user that contains their id
app.sendToken = function (res, userId) {
    var token = createJWT.sign(
        // payload
        { userId: userId },
        // secret
        app.secret,
        // options
        { expiresInMinutes: 10 }
    );
    res.send({ token: token });
    console.log('\tsent token');
}
 
// respond w/ token to POST request to /get-token
app.post('/get-token', bodyParser.json(), function (req, res) {
     
    // get Google token from Ember: { password: googleToken }
    var googleToken = req.body.password;
 
    // send token to Google for validation
    request('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + googleToken, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('\tGoogle Token Valid');
            var userId = JSON.parse(body).user_id;
            var userEmail = JSON.parse(body).email;
            app.sendToken(res, userId);
        } else {
            console.log('\tFailed to validate Google Token');
            res.send({});
        }
    });
});
```

Here, I created a new `app.sendToken` function for token creation. The created token now contains the Google id, so the node server will always know which Google user it's getting requests from. A more typical setup would be to exchange the Google id and email for whatever the associated user id is in your backend, and then use this id in the token, but I thought I'd keep things as simple as possible.

## Step 6: Refreshing the token

Our token expires in 10 minutes, so user's will have to log in w/ Google every 10 minutes. That's no good! We're going to create a refresh token endpoint at _localhost:4500/refresh-token_ that will get used 1 minute before the token expires. Just update _simple-auth-token_ in _environment.js_. 

```javascript
'simple-auth-token': {
  // get token
  serverTokenEndpoint: 'http://localhost:4500/get-token',
  // refresh token
  serverTokenRefreshEndpoint: 'http://localhost:4500/refresh-token',
  // timeFactor * refreshLeeway = milliseconds before token refresh
  timeFactor: 1000,   
  refreshLeeway: 60, // 1 minute
},
```

Then we'll create that endpoint in _server.js_. Here, we'll parse the token, get the `userId`, and then send back a new token with the same `userId`. 

```javascript
// Refresh token
app.post('/refresh-token', bodyParser.json(), function(req, res) {
     
    // verify token and extract contents (including userId)
    var oldToken = req.body.token;
    createJWT.verify(oldToken, app.secret, function (err, decodedToken) {
        if (!err) {
            // send new token
            console.log('\tRefreshing token for user ', decodedToken.userId);
            app.sendToken(res, decodedToken.userId);
        } else {
            // send error
            console.log('\tError while trying to refresh token:', err)
            res.send({});
        }
    });
});

```

Just for testing, modify `{ expiresInMinutes: 10 }` in `app.sendToken` so tokens expire every 2 minutes. This way you should see a token refresh every minute in your `node server` terminal and in the Network tab of the Chrome console on _localhost:4200_ once you're logged in. [

![/get-token and /refresh-token](http://micahjon.com/wp-content/uploads/2015/07/Screenshot-from-2015-07-18-112405.png)

Congrats! If you've gotten this far you're **good to go!** The next step is authorizing resources, which is pretty straightforward. Set up a model in Ember and then handle it's request like so: 

```javascript
// User requests list of notes
app.get('/notes', validateJWT({secret: app.secret}), function(req, res) {
 
    // get userId from token
    var userId = req.user.userId;
 
    // lookup notes for user...
    var notes = {
        'id': 1
        'content': 'A note for user '+ userId,
        'user': userId
    };
 
    // send notes to Ember
    res.send({ notes: notes });
});
```

Here, `validateJWT` (actually the _express-jwt_ library), automatically parses the token and provides `req.user`. This is handy for quickly getting the userId in each request from Ember to serve up the appropriate resources. In the above example, I return some JSON to Ember w/ _notes_ as the top-level element. This is currently how Ember Data likes to receive data, but is changing with [version 1.13](http://emberjs.com/blog/2015/06/18/ember-data-1-13-released.html) and the introduction of [JSON API](http://jsonapi.org/format/).

* * *

Hey, this is my first Ember tutorial and I'd appreciate your feedback! Authentication & Authorization can be tricky to get right, and I hope this pattern helps you get a better feel for things. If you run into issues, please consult my git repo [github.com/pranksinatra/basic-auth-demo](https://github.com/pranksinatra/basic-auth-demo) or leave a comment. Special thanks to [Martin Genev](https://github.com/mgenev) whose [post on 100PercentJS](http://www.100percentjs.com/authentication-single-page-applications-apis-sane-stack/) got me started.