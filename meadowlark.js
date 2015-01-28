/**
 * Created by znnz on 1/12/2014.
 */

var express=require('express');
var fs=require('fs');
var http=require('http');
var https=require('https');
//var cookieParser=require('cookie-parser');
var session=require('express-session');
var uuid=require('node-uuid');
var compression=require('compression');
var httpProxy=require('http-proxy');

httpProxy.createProxyServer({target:'http://localhost:3000'}).listen(8000);

var privateKey=fs.readFileSync('sslcert/server.key','utf-8');
var certificate=fs.readFileSync('sslcert/server.crt','utf-8');
var credentials={key:privateKey,cert:certificate};
var app=express();
var handlebars=require('express3-handlebars').create({
    defaultLayout:'main',
    helpers:{
        section:function(name,options){
            if(!this._sections) this._sections={};
            this._sections[name]=options.fn(this);
            return null;
        }
    }
});

app.engine('handlebars',handlebars.engine);
//app.use(cookieParser());
app.use(session({
    genid:function(req){
      return uuid.v1();
    },
    secret:'keyboard cat',
    resave:false,
    saveUnitialized:true,
    cookie:{secure:true, maxAge:60000}
}));
app.use(compression());
app.use(express.static(__dirname+'/public',{maxAge:86400000}));
app.set('view engine','handlebars');
app.set('port',process.env.PORT || 80);
app.disable('x-powered-by');
app.set('etag',function(body,encoding){
   return require('crypto').createHash('md5').update(body).digest('hex');
});


app.use(function (req,res,next) {
    console.log(req.ip);
    if(!res.locals.partials) res.locals.partials={};
    res.locals.partials.weather=getWeatherData();
    if(req.url.match(/^\/(css|js|img|font)\/.+/)){
        res.set('Cache-Control','public,max-age=3600');
    }
    res.locals.showTests=app.get('env')!=='production' && req.query.test=='1';
    next();
});
app.get('/headers',function(req,res){
    res.set('Content-Type','text/plain');
    var s='';
    for(var name in req.headers) s+=name+":  "+req,headers[name]+'\n';
    res.send();
});

app.get('/',function(req,res){
    res.render('home');
});


app.get('/about',function(req,res){
    var fortunes=["Conquer your fears or they will conquer you.","Rivers need springs",
                    "Do not fear what you don't know.","You will have a pleasant surprise.",
                    "Whenever possible, keep it simple"];
    var randomFortune=fortunes[Math.floor(Math.random()*fortunes.length)];
    res.render('about',{fortune:randomFortune,pageTestScript:'/qa/tests-about.js'});
});

app.get('/tours/hood-river',function(req,res){
   res.render('tours/hood-river');
});
app.get('/tours/request-group-rate',function(req,res){
   res.render('tours/request-group-rate');
});

app.get('/greeting',function(req,res){
    req.session.hello='hello from session';
   res.render('about',{
       message:'welcome',
       style:req.query.style,
       cookies:req.session.cookie.maxAge,
       session:req.session.hello
   }) ;
});

app.get('/no-layout',function(req,res){
    res.render('no-layout',{layout:null});
})

app.get('/custom-layout',function(req,res){
   res.render('custom-layout',{layout:'custom'});
});
app.get('/jquery-test',function(req,res){
    console.log("------jquery- test-------");
   res.render('jquery-test');
});
app.get('/nursery-rhyme',function(req,res){
    res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme',function(req,res){
    res.json({
       animal:'squirrel',
        bodyPart:'tail',
        adjective:'bushy',
        noun:'heck'
    });
});

var tours=[
    {id:0,name:'Hood River',price:99.99},
    {id:1,name:'Oregon Coast',price:149.95}
];

app.get('/api/tours',function(req,res){
  var toursXml='<?xml version="1.0"?><tours>'+tours.map(function(p){
          return '<tour price="'+ p.price+'" id="'+ p.id+'">'+ p.name+'</tour>';
      }).join('')+'</tours>';
  var toursText=tours.map(function(p){
      return p.id+': '+ p.name+' ('+ p.price+')';
  }).join('\n');

  res.format({
      'application/json':function(){
          res.json(tours);
      },
      'application/xml':function(){
          res.type('application/xml');
          res.send(toursXml);
      },
      'text/xml':function(){
          res.type('text/xml');
          res.send(toursXml);
      },
      'text/plain':function(){
          res.type('text/plain');
          res.send(toursXml);
      }
  })
});

app.put('/api/tour/:id',function(req,res){
   var p=tours.some(function(p){
       return p.id==req.params.id
   });
   if(p){
       if(req.query.name)p.name=req.query.name;
       if(req.query.price)p.price=req.query.price;
       console.log(req.query.name+" ------ "+ req.query.price);
       res.json({success:true});
   }else{
       res.json({error:'No such tour exists.'});
   }
});

app.delete('/api/tour/:id',function(req,res){
   var i;
    for(i=tours.length-1; i>=0;i--)
        if(tours[i].id==req.params.id)break;
    if(i>=0){
        tours.splice(i,1);
        res.json({success:true});
    }else{
        res.json({error:'No such tour exists.'});
    }
});


function getWeatherData(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)'
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)'
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)'
            },
        ]
    };
}


app.use(function(req,res,next){
    res.status(404);
    res.render('404');
});

app.use(function(err,req,res,next){
   console.error(err.stack);
    res.status(500);
    res.render('500');
});

http.createServer(app).listen(80);
https.createServer(credentials,app).listen(8443);

/*
app.listen(app.get('port'),function(){
   console.log('Express started on http://localhost:'+app.get('port')+'; press Ctrl-C to terminate');
});
*/
