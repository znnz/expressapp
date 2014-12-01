/**
 * Created by znnz on 1/12/2014.
 */

var express=require('express');
var app=express();
var handlebars=require('express3-handlebars').create({defaultLayout:'main'});

app.engine('handlebars',handlebars.engine);

app.set('view engine','handlebars');
app.set('port',process.env.PORT || 3000);
app.set('etag',function(body,encoding){
   return require('crypto').createHash('md5').update(body).digest('hex');
});


app.get('/',function(req,res){
    res.render('home');
});

app.get('/about',function(req,res){
    res.render('about');
});

app.use(function(req,res,next){
    res.status(404);
    res.render('404');
});

app.use(function(err,req,res,next){
   console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'),function(){
   console.log('Express started on http://localhost:'+app.get('port')+'; press Ctrl-C to terminate');
});
