"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backpack_client_1 = require("./backpack_client");

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
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

let successbuy = 0;
let sellbuy = 0;

const init = async (client) => {
    try {
        console.log(`成功买入次数:${successbuy},成功卖出次数:${sellbuy}`);
        console.log(getNowFormatDate(), "等待3秒...");
        await delay(3000);
        console.log(getNowFormatDate(), "正在获取账户信息中...");
        let userbalance = await client.Balance();
        //判断账号USDC余额是否大于5
        if (userbalance.USDC.available > 5) {
            await buyfun(client);
        } else {
            await sellfun(client);
            return;
        }
    } catch (e) {
        init(client);
        console.log(getNowFormatDate(), "挂单失败，重新挂单中...");
        await delay(1000);
    }
}



const sellfun = async (client) => {
    //取消所有未完成订单
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "取消了所有挂单");
    } else {
        console.log(getNowFormatDate(), "账号订单正常，无需取消挂单");
    }
    console.log(getNowFormatDate(), "正在获取账户信息中...");
    //获取账户信息
    let userbalance2 = await client.Balance();
    console.log(getNowFormatDate(), "账户信息:", userbalance2);
    console.log(getNowFormatDate(), "正在获取sol_usdc的市场当前价格中...");
    //获取当前
    let { lastPrice: lastPriceask } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "sol_usdc的市场当前价格:", lastPriceask);
    let quantitys = ((userbalance2.SOL.available / 2) - 0.02).toFixed(2).toString();
    console.log(getNowFormatDate(), `正在卖出中... 卖${quantitys}个SOL`);
    let orderResultAsk = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPriceask.toString(),
        quantity: quantitys,
        side: "Ask", //卖
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })

    if (orderResultAsk?.status == "Filled" && orderResultAsk?.side == "Ask") {
        console.log(getNowFormatDate(), "卖出成功");
        sellbuy += 1;
        console.log(getNowFormatDate(), "订单详情:", `卖出价格:${orderResultAsk.price}, 卖出数量:${orderResultAsk.quantity}, 订单号:${orderResultAsk.id}`);
        init(client);
    } else {
        console.log(getNowFormatDate(), "卖出失败");
        throw new Error("卖出失败");
    }
}

const buyfun = async (client) => {
    //取消所有未完成订单
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "取消了所有挂单");
    } else {
        console.log(getNowFormatDate(), "账号订单正常，无需取消挂单");
    }
    console.log(getNowFormatDate(), "正在获取账户信息中...");
    //获取账户信息
    let userbalance = await client.Balance();
    console.log(getNowFormatDate(), "账户信息:", userbalance);
    console.log(getNowFormatDate(), "正在获取sol_usdc的市场当前价格中...");
    //获取当前
    let { lastPrice } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "sol_usdc的市场当前价格:", lastPrice);
    console.log(getNowFormatDate(), `正在买入中... 花${(userbalance.USDC.available - 2).toFixed(2).toString()}个USDC买SOL`);
    let quantitys = ((userbalance.USDC.available - 2) / lastPrice).toFixed(2).toString();
    console.log("1024", quantitys);
    let orderResultBid = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPrice.toString(),
        quantity: quantitys,
        side: "Bid", //买
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })
    if (orderResultBid?.status == "Filled" && orderResultBid?.side == "Bid") {
        console.log(getNowFormatDate(), "下单成功");
        successbuy += 1;
        console.log(getNowFormatDate(), "订单详情:", `购买价格:${orderResultBid.price}, 购买数量:${orderResultBid.quantity}, 订单号:${orderResultBid.id}`);
        init(client);
    } else {
        console.log(getNowFormatDate(), "下单失败");
        throw new Error("买入失败");
    }
}

(async () => {
    const apisecret = "";
    const apikey = "";
    const client = new backpack_client_1.BackpackClient(apisecret, apikey);
    init(client);
})()

// 卖出
// client.ExecuteOrder({
//     orderType: "Limit",
//     price: "110.00",
//     quantity: "0.36",
//     side: "Ask", //卖
//     symbol: "SOL_USDC",
//     timeInForce: "IOC"
// }).then((result) => {
//     console.log(getNowFormatDate(),result);
// })

// 买入
// client.ExecuteOrder({
//     orderType: "Limit",
//     price: "110.00",
//     quantity: "0.36",
//     side: "Bid", //买
//     symbol: "SOL_USDC",
//     timeInForce: "IOC"
// }).then((result) => {
//     console.log(getNowFormatDate(),result);
// })
