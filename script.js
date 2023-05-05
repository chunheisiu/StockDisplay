const urlPre = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=";
const urlSuf = "&apikey=7OSKDO9RIHMITDRM";
const reloadTime = 20000;

let stocks;

function init() {
    loadStock();
    reload();
}

function loadStock() {
    const stockList = getQueryVariable("symbols");
    if (stockList != null) {
        stocks = stockList.split(',');
        stocks.sort();
        for (const stock of stocks) {
            createTile(stock);
            requestStock(stock);
        }
    } else {
        // Testing txt doc fallback
        loadStockWithTxt();
    }
}

function loadStockWithTxt() {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            stocks = this.responseText.split('\n');
            stocks.sort();
            for (const stock of stocks) {
                createTile(stock);
                requestStock(stock);
            }
        }
    };
    xmlHttp.open("GET", urlStock, true);
    xmlHttp.send();
}

function reload() {
    setTimeout(function () {
        for (const stock of stocks) {
            requestStock(stock);
        }
        reload();
    }, reloadTime);
}

function requestStock(stock) {
    const xmlHttp = new XMLHttpRequest();
    const url = urlPre + stock + urlSuf;
    xmlHttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            const response = this.responseText;
            const stockObj = parseJSONResponse(response);

            try {
                const stockArr = parseStock(stockObj);
                updateTile(stockArr);
            } catch (e) {
                requestStock(stock);
            }
        }
    };
    xmlHttp.open("GET", url, true);
    xmlHttp.send();
}

function parseJSONResponse(response) {
    return JSON.parse(response);
}

function parseStock(stockObj) {
    const stockName = stockObj["Meta Data"]["2. Symbol"];
    const stockData = stockObj["Time Series (Daily)"];
    const dates = Object.keys(stockData).sort();
    const today = stockData[dates[99]];
    const previous = stockData[dates[98]];
    const prevClose = parseFloat(previous["4. close"]);
    const todayClose = parseFloat(today["4. close"]);
    const change = todayClose - prevClose;
    const percentage = change / prevClose * 100;
    return [stockName, todayClose, change, percentage];
}

function createTile(stock) {
    const div = document.createElement("div");
    div.setAttribute("class", "box");
    div.setAttribute("id", stock);
    let html;
    html = "<div class='box-content'>";
    html += "<span class='stock-title'>" + stock + "</span><br>";
    html += "<span class='stock-price'>––.––</span><br>";
    html += "<span class='stock-price-chg'>––.–– (––.––%)</span><br>";
    html += "</div>";
    div.innerHTML = html;
    document.getElementById("container").appendChild(div);
}

function updateTile(stockArr) {
    let tileClass = "";
    let sign = "";

    if (stockArr[2] > 0) {
        tileClass = " up";
        sign = "+";
    } else if (stockArr[2] < 0) {
        tileClass = " down"
    }

    const div = document.getElementById(stockArr[0]);
    div.setAttribute("class", "box" + tileClass);

    let html;
    html = "<div class='box-content'>";
    html += "<span class='stock-title'>" + stockArr[0] + "</span><br>";
    html += "<span class='stock-price'>" + stockArr[1].toFixed(2) + "</span><br>";
    html += "<span class='stock-price-chg'>" + sign + stockArr[2].toFixed(2) + " (" + stockArr[3].toFixed(2) + "%)</span><br>";
    html += "</div>";
    div.innerHTML = html;

    div.setAttribute("style", "filter: brightness(1.5);");
    setTimeout(function () {
        div.removeAttribute("style");
    }, 500)
}

function getQueryVariable(variable) {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) === variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
}

function add() {
    const symbol = document.getElementById("symbol").value;

    if (symbol !== "") {
        if (!getQueryVariable("symbols")) {
            window.location.replace("../?symbols=" + symbol)
        } else {
            window.location.replace(window.location + "," + symbol)
        }
    }
}

function on() {
    document.getElementById("overlay").style.display = "block";
}

function off() {
    document.getElementById("overlay").style.display = "none";
}

init();
