# Node.js + MongoDB weather scraper
This project will periodically scrape the data from https://opendata.cwb.gov.tw/dataset/observation/O-A0003-001.

## How to use
Send a GET request to http://140.119.19.117:3000/

## Steps
1. Create database "weather" and collection "weatherInfo" in mongoDB
2. Create .env file as following
```
APIKEY=Your Apikey from https://opendata.cwb.gov.tw/dataset/observation/O-A0003-001
DB_URL=mongodb://localhost:27017/weather
```
3. Run following commands
```
npm install
node index.js
```
4. Access the data at http://localhost:3000/