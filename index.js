var http = require('http');
var url = require('url');
var util = require('util');
var request = require('request');
const mongo = require('mongodb').MongoClient;
require('dotenv').config();

openweather_url = "https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/O-A0003-001?Authorization=" + 
                process.env.APIKEY + "&format=json";
db_url = process.env.DB_URL;

http.createServer((req, res) => {
    if (req.url == "/") { 
        mongo.connect(db_url, (err, db) => {
            if(err) throw err;
            var t = new Date().toISOString();  
            console.log(t + ' Http Get Request!');
            
            db.collection('weatherInfo', (err, collection) => {
                collection.find({}).toArray((err, items) => {
                    if (err) throw err;
                    weather_data = [];
                    items.forEach(element => {
                        weather_detail = JSON.parse(element.weatherElement);
                        loc = JSON.parse(element.location);
                        locName = loc[0].parameterValue + loc[2].parameterValue;

                        weather_single = {位置: locName, 觀測時間: element.obsTime, 溫度: weather_detail[3].elementValue.value, 
                            本日最高溫: weather_detail[14].elementValue.value == "-99" ? "未觀測" : weather_detail[14].elementValue.value,
                            本日最低溫: weather_detail[16].elementValue.value == "-99" ? "未觀測" : weather_detail[16].elementValue.value,
                            天氣描述: weather_detail[20].elementValue.value == "-99" ? "未觀測" : weather_detail[20].elementValue.value}       
                        weather_data.push(weather_single);
                    });
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(weather_data));
                    res.end();
                });
            });
        });
    }
    setInterval(() => {
        request({
            uri: openweather_url,
            method: "GET",
            timeout: 2000,
            followRedirect: true,
            maxRedirects: 10
        }, (err, response, body) => {
            if (err) throw err;

            loc = ['臺北市', '新北市', '桃園市']
            res = JSON.parse(body);
            data = [];

            var traversal = new Promise((resolve, reject) => {
                res.cwbopendata.location.forEach((element, index) => {
                    if (loc.includes(element.parameter[0].parameterValue)) {
                        data.push(element);
                    }
                    if (index === res.cwbopendata.location.length -1) resolve();
                });
            });
            traversal.then(() => {
                mongoConnect(data);
            });
        });
    }, 3600000);
}).listen(3000);
console.log('Http server is running on port 3000!')

function mongoConnect(data){
    mongo.connect(db_url, (err, db) => {
        if(err) throw err;
        console.log('mongodb is running!');

        db.collection('weatherInfo', (err, collection) => {
            data.forEach(element => {
                collection.find({id: element.stationId}).toArray((err, items) => {
                    if (err) throw err;
                    if (items.length == 1) {
                        collection.updateOne({id: element.stationId}, {$set: {obsTime: element.time.obsTime, 
                            weatherElement: JSON.stringify(element.weatherElement), 
                            location: JSON.stringify(element.parameter)}}, (err, res) => {
                                if (err) throw err;
                                var t = new Date().toISOString();
                                console.log(t + ' Station ' + element.stationId + ' data updated successfully');
                        });
                    } else {
                        collection.insert({id: element.stationId, obsTime: element.time.obsTime, 
                            weatherElement: JSON.stringify(element.weatherElement), 
                            location: JSON.stringify(element.parameter)}, (err, res) => {
                                if (err) throw err;
                                var t = new Date().toISOString();
                                console.log(t + ' Station ' + element.stationId + ' data inserted successfully');
                        });        
                    }
                });
            });
        });
    });
}

