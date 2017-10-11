const urlPre = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=";
const urlSuf = "&apikey=7OSKDO9RIHMITDRM";

var stocks;

function init() {
  loadStock();
  reload();
}

function loadStock() {
  var xmlhttp = new XMLHttpRequest();
  var url = "stocks.txt";
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      stocks = this.responseText.split('\n');
      for (var stock of stocks) {
        createTile(stock);
        requestStock(stock);
      }
    }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function reload() {
  setTimeout(function() {
    for (var stock of stocks) {
      requestStock(stock);
    }
    reload();
  }, 30000);
}

function requestStock(stock) {
  var xmlhttp = new XMLHttpRequest();
  var url = urlPre + stock + urlSuf;
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var response = this.responseText;
      var stockObj = parseJSONReponse(response);

      try {
        var stockArr = parseStock(stockObj);
        updateTile(stockArr);
      } catch (e) {
        requestStock(stock);
      }
    }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function parseJSONReponse(response) {
  return JSON.parse(response);
}

function parseStock(stockObj) {
  var stockName = stockObj["Meta Data"]["2. Symbol"];
  var stockData = stockObj["Time Series (Daily)"];
  var dates = Object.keys(stockData).sort();
  var today = stockData[dates[99]];
  var previous = stockData[dates[98]];
  var prevClose = parseFloat(previous["4. close"]);
  var todayClose = parseFloat(today["4. close"]);
  var change = todayClose - prevClose;
  var percentage = change / prevClose * 100;
  var resultArr = [stockName, todayClose, change, percentage];
  return resultArr;
}

function createTile(stock) {
  var div = document.createElement("div");
  div.setAttribute("class", "box");
  div.setAttribute("id", stock);
  var html;
  html = "<div class='box-content'>";
  html += "<span class='stocktitle'>" + stock + "</span><br>";
  html += "<span class='stockprice'>$––.––</span><br>";
  html += "<span class='stockpricechg'>––.–– (––.––%)</span><br>";
  html += "</div>";
  div.innerHTML = html;
  document.getElementById("container").appendChild(div);
}

function updateTile(stockArr) {
  var tileClass = "";
  var sign = "";

  if (stockArr[2] > 0) {
    tileClass = " up";
    sign = "+";
  } else if (stockArr[2] < 0){
    tileClass = " down"
  };

  var div = document.getElementById(stockArr[0]);
  div.setAttribute("class", "box" + tileClass);

  var html;
  html = "<div class='box-content'>";
  html += "<span class='stocktitle'>" + stockArr[0] + "</span><br>";
  html += "<span class='stockprice'>$" + stockArr[1].toFixed(2) + "</span><br>";
  html += "<span class='stockpricechg'>" + sign + stockArr[2].toFixed(2) + " (" + stockArr[3].toFixed(2) + "%)</span><br>";
  html += "</div>";
  div.innerHTML = html;

  div.setAttribute("style", "filter: brightness(1.5);");
  setTimeout(function() {
    div.removeAttribute("style");
  }, 500)
}

init();
