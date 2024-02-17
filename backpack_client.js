"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackpackClient = void 0;
const got_1 = __importDefault(require("got"));
const crypto_1 = __importDefault(require("crypto"));
const qs_1 = __importDefault(require("qs"));
const ws_1 = __importDefault(require("ws"));
const BACKOFF_EXPONENT = 1.5;
const DEFAULT_TIMEOUT_MS = 5000;
// const BASE_URL = "https://api.backpack.exchange/";
const BASE_URL = "https://api.cf.backpack.exchange/";
// 执行对应操作的命令
const instructions = {
    public: new Map([
        ["assets", { url: `${BASE_URL}api/v1/assets`, method: "GET" }],
        ["markets", { url: `${BASE_URL}api/v1/markets`, method: "GET" }],
        ["ticker", { url: `${BASE_URL}api/v1/ticker`, method: "GET" }],
        ["depth", { url: `${BASE_URL}api/v1/depth`, method: "GET" }],
        ["klines", { url: `${BASE_URL}api/v1/klines`, method: "GET" }],
        ["status", { url: `${BASE_URL}api/v1/status`, method: "GET" }],
        ["ping", { url: `${BASE_URL}api/v1/ping`, method: "GET" }],
        ["time", { url: `${BASE_URL}api/v1/time`, method: "GET" }],
        ["trades", { url: `${BASE_URL}api/v1/trades`, method: "GET" }],
        [
            "tradesHistory",
            { url: `${BASE_URL}api/v1/trades/history`, method: "GET" },
        ],
    ]),
    private: new Map([
        ["balanceQuery", { url: `${BASE_URL}api/v1/capital`, method: "GET" }],
        [
            "depositAddressQuery",
            { url: `${BASE_URL}wapi/v1/capital/deposit/address`, method: "GET" },
        ],
        [
            "depositQueryAll",
            { url: `${BASE_URL}wapi/v1/capital/deposits`, method: "GET" },
        ],
        [
            "fillHistoryQueryAll",
            { url: `${BASE_URL}wapi/v1/history/fills`, method: "GET" },
        ],
        ["orderCancel", { url: `${BASE_URL}api/v1/order`, method: "DELETE" }],
        ["orderCancelAll", { url: `${BASE_URL}api/v1/orders`, method: "DELETE" }],
        ["orderExecute", { url: `${BASE_URL}api/v1/order`, method: "POST" }],
        [
            "orderHistoryQueryAll",
            { url: `${BASE_URL}wapi/v1/history/orders`, method: "GET" },
        ],
        ["orderQuery", { url: `${BASE_URL}api/v1/order`, method: "GET" }],
        ["orderQueryAll", { url: `${BASE_URL}api/v1/orders`, method: "GET" }],
        [
            "withdraw",
            { url: `${BASE_URL}wapi/v1/capital/withdrawals`, method: "POST" },
        ],
        [
            "withdrawalQueryAll",
            { url: `${BASE_URL}wapi/v1/capital/withdrawals`, method: "GET" },
        ],
    ]),
};
//解码私钥成pkcs8编码的私钥 因为crypto.sign需要的私钥格式是pkcs8格式
// https://stackoverflow.com/questions/71916954/crypto-sign-function-to-sign-a-message-with-given-private-key
const toPkcs8der = (rawB64) => {
    var rawPrivate = Buffer.from(rawB64, "base64").subarray(0, 32);
    var prefixPrivateEd25519 = Buffer.from("302e020100300506032b657004220420", "hex");
    var der = Buffer.concat([prefixPrivateEd25519, rawPrivate]);
    return crypto_1.default.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
};
//解码公钥成spki编码的私钥 因为crypto.sign需要的公钥格式是spki格式
// https://stackoverflow.com/questions/68612396/sign-and-verify-jws-json-web-signature-with-ed25519-keypair
const toSpki = (rawB64) => {
    var rawPublic = Buffer.from(rawB64, "base64");
    var prefixPublicEd25519 = Buffer.from("302a300506032b6570032100", "hex");
    var der = Buffer.concat([prefixPublicEd25519, rawPublic]);
    return crypto_1.default.createPublicKey({ key: der, format: "der", type: "spki" });
};
/**
 * 生成签名方法 getMessageSignature
 * https://docs.backpack.exchange/#section/Authentication/Signing-requests
 * @param  {Object}        request params as an object
 * @param  {UInt8Array}    privateKey
 * @param  {number}        timestamp Unix time in ms that the request was sent
 * @param  {string}        instruction
 * @param  {number}        window Time window in milliseconds that the request is valid for
 * @return {string}        base64 encoded signature to include on request
 */
const getMessageSignature = (request, privateKey, timestamp, instruction, window) => {
    function alphabeticalSort(a, b) {
        return a.localeCompare(b);
    }
    const message = qs_1.default.stringify(request, { sort: alphabeticalSort });
    const headerInfo = { timestamp, window: window ?? DEFAULT_TIMEOUT_MS };
    const headerMessage = qs_1.default.stringify(headerInfo);
    const messageToSign = "instruction=" +
        instruction +
        "&" +
        (message ? message + "&" : "") +
        headerMessage;
    const signature = crypto_1.default.sign(null, Buffer.from(messageToSign), toPkcs8der(privateKey));
    return signature.toString("base64");
};
// 请求方法 rawRequest(命令，请求头，请求参数)
const rawRequest = async (instruction, headers, data) => {
    const { url, method } = instructions.private.has(instruction)
        ? instructions.private.get(instruction)
        : instructions.public.get(instruction);
    let fullUrl = url;
    headers["User-Agent"] = "Backpack Typescript API Client";
    headers["Content-Type"] =
        method == "GET"
            ? "application/x-www-form-urlencoded"
            : "application/json; charset=utf-8";
    const options = { headers };
    if (method == "GET") {
        Object.assign(options, { method });
        fullUrl =
            url + (Object.keys(data).length > 0 ? "?" + qs_1.default.stringify(data) : "");
    }
    else if (method == "POST" || method == "DELETE") {
        Object.assign(options, {
            method,
            body: JSON.stringify(data),
        });
    }
    const response = await (0, got_1.default)(fullUrl, options);
    const contentType = response.headers["content-type"];
    if (contentType?.includes("application/json")) {
        const parsed = JSON.parse(response.body, function (_key, value) {
            if (value instanceof Array && value.length == 0) {
                return value;
            }
            if (isNaN(Number(value))) {
                return value;
            }
            return Number(value);
        });
        if (parsed.error && parsed.error.length) {
            const error = parsed.error
                .filter((e) => e.startsWith("E"))
                .map((e) => e.substr(1));
            if (!error.length) {
                throw new Error("Backpack API returned an unknown error");
            }
            throw new Error(`url=${url} body=${options["body"]} err=${error.join(", ")}`);
        }
        return parsed;
    }
    else if (contentType?.includes("text/plain")) {
        return response.body;
    }
    else {
        return response;
    }
};
/**
 * 初始化BackpackClient 填入私钥和公钥
 * BackpackClient connects to the Backpack API
 * @param {string}        privateKey base64 encoded
 * @param {string}        publicKey  base64 encoded
 */
class BackpackClient {
    constructor(privateKey, publicKey) {
        this.config = { privateKey, publicKey };
        // Verify that the keys are a correct pair before sending any requests. Ran
        // into errors before with that which were not obvious.
        const pubkeyFromPrivateKey = crypto_1.default
            .createPublicKey(toPkcs8der(privateKey))
            .export({ format: "der", type: "spki" })
            .toString("base64");
        const pubkey = toSpki(publicKey)
            .export({ format: "der", type: "spki" })
            .toString("base64");
        if (pubkeyFromPrivateKey != pubkey) {
            throw new Error("错误的秘钥对，请检查私钥公钥是否匹配");
        }
    }
    /**
     * 发送公共或私有API请求
     * This method makes a public or private API request.
     * @param  {String}   method   方法名 The API method (public or private)
     * @param  {Object}   params   Arguments to pass to the api call
     * @param  {Number}   retrysLeft
     * @return {Object}   The response object 重试请求的次数
     */
    async api(method, params, retrysLeft = 10) {
        try {
            if (instructions.public.has(method)) {
                return await this.publicMethod(method, params);
            }
            else if (instructions.private.has(method)) {
                return await this.privateMethod(method, params);
            }
        }
        catch (e) {
            if (retrysLeft > 0) {
                const numTry = 11 - retrysLeft;
                const backOff = Math.pow(numTry, BACKOFF_EXPONENT);
                console.warn("BPX api error", {
                    method,
                    numTry,
                    backOff,
                }, e.toString(), e.response && e.response.body ? e.response.body : '');
                await new Promise((resolve) => setTimeout(resolve, backOff * 1000));
                return await this.api(method, params, retrysLeft - 1);
            }
            else {
                throw e;
            }
        }
        throw new Error(method + " is not a valid API method.");
    }
    /**
     * 发送公共API请求
     * This method makes a public API request.
     * @param  {String}   instruction   The API method (public or private)
     * @param  {Object}   params        Arguments to pass to the api call
     * @return {Object}                 The response object
     */
    async publicMethod(instruction, params = {}) {
        const response = await rawRequest(instruction, {}, params);
        return response;
    }
    /**
     * 发送私有API请求
     * This method makes a private API request.
     * @param  {String}   instruction The API method (public or private)
     * @param  {Object}   params      Arguments to pass to the api call
     * @return {Object}               The response object
     */
    async privateMethod(instruction, params = {}) {
        const timestamp = Date.now();
        const signature = getMessageSignature(params, this.config.privateKey, timestamp, instruction);
        const headers = {
            "X-Timestamp": timestamp,
            "X-Window": this.config.timeout ?? DEFAULT_TIMEOUT_MS,
            "X-API-Key": this.config.publicKey,
            "X-Signature": signature,
        };
        const response = await rawRequest(instruction, headers, params);
        return response;
    }
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/get_balances
     */
    async Balance() {
        return this.api("balanceQuery");
    }
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/get_deposits
     */
    async Deposits(params) {
        return this.api("depositQueryAll", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/get_deposit_address
     */
    async DepositAddress(params) {
        return this.api("depositAddressQuery", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/get_withdrawals
     */
    async Withdrawals(params) {
        return this.api("withdrawalQueryAll", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/request_withdrawal
     */
    async Withdraw(params) {
        this.api("withdraw", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/History/operation/get_order_history
     */
    async OrderHistory(params) {
        return this.api("orderHistoryQueryAll", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/History/operation/get_fills
     */
    async FillHistory(params) {
        return this.api("fillHistoryQueryAll", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_assets
     */
    async Assets() {
        return this.api("assets");
    }
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_markets
     */
    async Markets() {
        return this.api("markets");
    }
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_ticker
     */
    async Ticker(params) {
        return this.api("ticker", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_depth
     */
    async Depth(params) {
        return this.api("depth", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_klines
     */
    async KLines(params) {
        return this.api("klines", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/get_order
     */
    async GetOrder(params) {
        return this.api("orderQuery", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/execute_order
     */
    async ExecuteOrder(params) {
        return this.api("orderExecute", params, 0);
    }
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/cancel_order
     */
    async CancelOrder(params) {
        return this.api("orderCancel", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/get_open_orders
     */
    async GetOpenOrders(params) {
        return this.api("orderQueryAll", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/cancel_open_orders
     */
    async CancelOpenOrders(params) {
        return this.api("orderCancelAll", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/System/operation/get_status
     */
    async Status() {
        return this.api("status");
    }
    /**
     * https://docs.backpack.exchange/#tag/System/operation/ping
     */
    async Ping() {
        return this.api("ping");
    }
    /**
     * https://docs.backpack.exchange/#tag/System/operation/get_time
     */
    async Time() {
        return this.api("time");
    }
    /**
     * https://docs.backpack.exchange/#tag/Trades/operation/get_recent_trades
     */
    async RecentTrades(params) {
        return this.api("trades", params);
    }
    /**
     * https://docs.backpack.exchange/#tag/Trades/operation/get_historical_trades
     */
    async HistoricalTrades(params) {
        return this.api("tradesHistory", params);
    }
    /**
      * https://docs.backpack.exchange/#tag/Streams/Private
      * @return {Object} Websocket     Websocket connecting to order update stream
      */
    subscribeOrderUpdate() {
        const privateStream = new ws_1.default('wss://ws.backpack.exchange');
        const timestamp = Date.now();
        const window = 5000;
        const signature = getMessageSignature({}, this.config.privateKey, timestamp, "subscribe", window);
        const subscriptionData = {
            method: 'SUBSCRIBE',
            params: ["account.orderUpdate"],
            "signature": [this.config.publicKey, signature, timestamp.toString(), window.toString()]
        };
        privateStream.onopen = (_) => {
            console.log('Connected to BPX Websocket');
            privateStream.send(JSON.stringify(subscriptionData));
        };
        privateStream.onerror = (error) => {
            console.log(`Websocket Error ${error}`);
        };
        return privateStream;
    }
}
exports.BackpackClient = BackpackClient;
