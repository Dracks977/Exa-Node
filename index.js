/*=====================Initialisation=====================*/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const httpd = require('https');
var fs = require('fs');
var requestSync = require("request-sync");


app.get('/', function(req, res){
	res.sendFile('index.html', { root: __dirname });
});

io.on('connection', function(socket){
	console.log('a user connected {' + socket.request.connection.remoteAddress + "}");

	socket.on('disconnect', function(){
		console.log('user disconnected ' + socket.request.connection.remoteAddress);
	});
	socket.on('search', function(data){
		console.log("new search incoming from :" + socket.request.connection.remoteAddress + " >>>>> " + data);
		var reponse = requestSync("http://carbone.lan:11310/search-api/search?b=0&hf=18&q=" + data + "&output_format=json&use_logic_hit_metas=true");
		var f_rep = JSON.parse(reponse.body).hits;
		var f_fac = JSON.parse(reponse.body).groups;
		var tab_rep = [f_rep, f_fac];
		var f_suggest = JSON.parse(reponse.body).spellCheckSuggestions.suggestions;
		if (JSON.parse(reponse.body).nhits > 0)
			socket.emit('result', tab_rep);
		else
			socket.emit('No_Result');
		socket.emit('Rsugest', f_suggest);
	});
	socket.on('facette', function(data){
		console.dir('facette');
		console.log("new facette :" + socket.request.connection.remoteAddress + " >>>>> " + data.s + " and " + data.fs + " : " +data.f);
		var f = encodeURIComponent(data.f)
		console.log("http://carbone.lan:11310/search-api/search?b=0&hf=18&q="+data.fs+"%3A"+f+" AND "+ data.s + "&output_format=json&use_logic_hit_metas=true")
		var reponse = requestSync("http://carbone.lan:11310/search-api/search?b=0&hf=18&q="+data.fs+"%3A"+f+" AND "+ data.s + "&output_format=json&use_logic_hit_metas=true");
		var f_rep = JSON.parse(reponse.body).hits;
		var tab_rep = [f_rep, 666];
		socket.emit('result', tab_rep);
	})

	socket.on('more', function(data){
		console.dir(data);
		var page = data.p * 18;
		console.log("new more incoming from :" + socket.request.connection.remoteAddress + " >>>>> " + data.s + " and page " + data.p);
		if (data.fs == ''){
			var reponse = requestSync("http://carbone.lan.fr:11310/search-api/search?b=" + page + "&hf=18&q=" + data.s + "&output_format=json&use_logic_hit_metas=true");
		}
		else{
			console.log('else ' + data.f + data.fs);
			var f = encodeURIComponent(data.f)
			console.log(f);
			console.log("http://carbone.lan:11310/search-api/search?b=" + page + "&hf=18&q="+data.fs+"%2F"+f+"AND"+ data.s + "&output_format=json&use_logic_hit_metas=true")
			var reponse = requestSync("http://carbone.lan:11310/search-api/search?b=" + page + "&hf=18&q="+data.fs+"%3A"+f+" AND "+ data.s + "&output_format=json&use_logic_hit_metas=true");
		}

		var f_rep = JSON.parse(reponse.body).hits;
		var tab_rep = [f_rep, 666];
		if (JSON.parse(reponse.body).nhits > 0)
			socket.emit('result', tab_rep);
		else
			socket.emit('full');
	});

	
});

/*======================Start========================*/
http.listen(3000, function(){
	console.log('listening on *:3000');
});
