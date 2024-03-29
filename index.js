"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backpack_client_1 = require("./backpack_client");
const { checkbox, input } = require('@inquirer/prompts');
const { tokenList } = require('./token');
function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function getRandomIndex(array) {
    return Math.floor(Math.random() * array.length);
}
//当前年份日期时分秒
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var strHour = date.getHours();
    var strMinute = date.getMinutes();
    var strSecond = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (strHour >= 0 && strHour <= 9) {
        strHour = "0" + strHour;
    }
    if (strMinute >= 0 && strMinute <= 9) {
        strMinute = "0" + strMinute;
    }
    if (strSecond >= 0 && strSecond <= 9) {
        strSecond = "0" + strSecond;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + strHour + seperator2 + strMinute
        + seperator2 + strSecond;
    return currentdate;
}

//返回小数位
function countDecimalPlaces(number) {
    let decimalPart = String(number).match(/\.(\d*)/);
    return decimalPart ? decimalPart[1].length : 0;
}

let successbuy = 0;
let sellbuy = 0;

const init = async (client, token, random, money) => {
    let markets = await client.Markets();
    let tokensDecimal = {};
    //token 最小交易小数位
    markets.forEach((market) => {
        tokensDecimal[market.symbol] = countDecimalPlaces(market.filters.quantity.minQuantity);
    });
    console.log(getNowFormatDate(), "初始化完成");
    while (true) {
        try {
            let tokenIndex = getRandomIndex(token);
            let randomIndex = getRandomIndex(random);
            let moneyIndex = getRandomIndex(money);

            console.log(`成功买入次数:${successbuy},成功卖出次数:${sellbuy}`);
            console.log(getNowFormatDate(), `等待${random[randomIndex]}秒...`);
            await delay(random[randomIndex]);
            console.log(getNowFormatDate(), "正在获取账户信息中...");
            let userbalance = await client.Balance();
            let tokenPriceList = await client.Tickers();
            Object.keys(userbalance).map((item) => {
                if (item == 'USDC') {
                    userbalance[item].value = userbalance[item].available;
                    userbalance[item].symbol = `USDC`;
                    return;
                };
                userbalance[item].value = userbalance[item].available * tokenPriceList.find((token) => token.symbol == `${item}_USDC`).lastPrice;
                userbalance[item].symbol = `${item}_USDC`;
            })
            //当前账号价值最大的币种名字 跳过symbol为USDC的币种
            let maxToken = Object.keys(userbalance).filter((item) => item != 'USDC').reduce((a, b) => userbalance[a].value > userbalance[b].value ? a : b);
            let condition1 = maxToken == "USDC" ? true : userbalance[maxToken].value < 8;
            //判断账号USDC余额是否大于5以及购买的币种余额是否小于5USDC
            if (userbalance.USDC.available > 5 && condition1) {
                //根据比例随机买入随机币种
                await buyfun(client, token[tokenIndex], money[moneyIndex]);
            } else {
                //指定账号价值最大的币 拿去卖出
                await sellfun(client, `${maxToken}_USDC`, money[moneyIndex], tokensDecimal);
                return;
            }
        } catch (e) {
            console.log(getNowFormatDate(), "挂单失败，重新挂单中...");
            await delay(1000);
        }
    }
}



const sellfun = async (client, token, money, tokensDecimal) => {
    //取消所有未完成订单
    let GetOpenOrders = await client.GetOpenOrders({ symbol: token });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: token });
        console.log(getNowFormatDate(), "取消了所有挂单");
    } else {
        console.log(getNowFormatDate(), "账号订单正常，无需取消挂单");
    }
    console.log(getNowFormatDate(), "正在获取账户信息中...");
    //获取账户信息
    let userbalance2 = await client.Balance();
    console.log(getNowFormatDate(), "账户信息:", userbalance2);
    console.log(getNowFormatDate(), `正在获取${token}的市场当前价格中...`);
    //获取当前
    let currentToken = token.split('_')[0];
    let { lastPrice: lastPriceask } = await client.Ticker({ symbol: token });
    console.log(getNowFormatDate(), `${token}的市场当前价格:`, lastPriceask);
    let quantitys = ((userbalance2[currentToken].available * (money / 100))).toFixed(tokensDecimal[token]).toString();
    console.log(getNowFormatDate(), `正在卖出中... 卖${quantitys}个${token}`);
    let orderResultAsk = await client.ExecuteOrder({
        orderType: "Limit",
        postOnly: false,
        price: lastPriceask.toString(),
        quantity: quantitys,
        side: "Ask", //卖
        symbol: token
    })
    
    if (orderResultAsk?.status == "Filled" && orderResultAsk?.side == "Ask") {
        console.log(getNowFormatDate(), "卖出成功");
        sellbuy += 1;
        console.log(getNowFormatDate(), "订单详情:", `卖出价格:${orderResultAsk.price}, 卖出数量:${orderResultAsk.quantity}, 订单号:${orderResultAsk.id}`);
        throw new Error("买入成功、程序重新执行");
    } else {
        console.log(getNowFormatDate(), "卖出失败");
        throw new Error("卖出失败");
    }
}

// 挂单。通过money变量的比例用USDC买入token
const buyfun = async (client, token, money) => {
    //取消所有未完成订单
    let GetOpenOrders = await client.GetOpenOrders({ symbol: token });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: token });
        console.log(getNowFormatDate(), "取消了所有挂单");
    } else {
        console.log(getNowFormatDate(), "账号订单正常，无需取消挂单");
    }
    console.log(getNowFormatDate(), "正在获取账户信息中...");
    //获取账户信息
    let userbalance = await client.Balance();
    console.log(getNowFormatDate(), "账户信息:", userbalance);
    console.log(getNowFormatDate(), "正在获取" + token + "的市场当前价格中...");
    let PayUSDC = (userbalance.USDC.available * (money / 100)) - 2;
    //获取当前
    let { lastPrice } = await client.Ticker({ symbol: token });
    console.log(getNowFormatDate(), "" + token + "的市场当前价格:", lastPrice);
    console.log(getNowFormatDate(), `正在买入中... 花${(PayUSDC).toFixed(0).toString()}个USDC买${token}`);
    let quantitys = ((PayUSDC) / lastPrice).toFixed(0).toString();
    let orderResultBid = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPrice.toString(),
        quantity: quantitys,
        side: "Bid", //买
        symbol: token,
        timeInForce: "IOC"
    })
    if (orderResultBid?.status == "Filled" && orderResultBid?.side == "Bid") {
        console.log(getNowFormatDate(), "下单成功");
        successbuy += 1;
        console.log(getNowFormatDate(), "订单详情:", `购买价格:${orderResultBid.price}, 购买数量:${orderResultBid.quantity}, 订单号:${orderResultBid.id}`);
        throw new Error("买入成功、程序重新执行");
    } else {
        console.log(getNowFormatDate(), "下单失败");
        throw new Error("买入失败");
    }
}

(async () => {
    const tokenAnswer = await checkbox(tokenList); //币种列表
    if (tokenAnswer.length == 0) {
        console.log("未选择币种，退出");
        return;
    }
    console.log("已选", tokenAnswer);
    const randomAnser = await input({
        message: '请输入交易随机时间间隔(秒)格式为 数字-数字，默认可不填',
        default: "1-3",
        validate: function (value) {
            const pass = value.match(/^\d+-\d+$/);
            if (pass) {
                const numbers = value.split('-').map(Number);
                if (numbers[0] < numbers[1]) {
                    return true;
                }
                return '第一个数字必须小于第二个数字！';
            }
            return '请输入正确格式的字符串（例如 "12-43"）！';
        },
    });
    console.log(`已选${randomAnser}秒 随机交易`);

    const moneyAnser = await input({
        message: '请输入交易随机代币比例，格式为 数字%-数字%，默认可不填',
        default: "40%-70%",
        validate: function (value) {
            const pass = value.match(/^\d+%-\d+%$/);
            if (pass) {
                const numbers = value.split('-').map(num => parseInt(num, 10));
                if (numbers[0] < numbers[1]) {
                    return true;
                }
                return '第一个数字必须小于第二个数字！';
            }
            return '请输入正确格式的字符串（例如 "12%-43%"）！';
        }
    });
    console.log(`已选${moneyAnser}比例 随机交易`);

    let randomAnserArr = randomAnser.split('-').map(Number);
    randomAnserArr = Array.from({ length: randomAnserArr[1] - randomAnserArr[0] + 1 }, (_, index) => index + randomAnserArr[0]);
    let moneyAnserArr = moneyAnser.split('-').map(s => parseInt(s, 10));
    moneyAnserArr = Array.from({ length: moneyAnserArr[1] - moneyAnserArr[0] + 1 }, (_, index) => index + moneyAnserArr[0]);

    const apisecret = "";
    const apikey = "";
    const client = new backpack_client_1.BackpackClient(apisecret, apikey);
    init(client, tokenAnswer, randomAnserArr, moneyAnserArr);
})();
