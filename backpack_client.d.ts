import WebSocket from 'ws';
/**
 * 初始化BackpackClient 填入私钥和公钥
 * BackpackClient connects to the Backpack API
 * @param {string}        privateKey base64 encoded
 * @param {string}        publicKey  base64 encoded
 */
export declare class BackpackClient {
    config: any;
    constructor(privateKey: string, publicKey: string);
    /**
     * 发送公共或私有API请求
     * This method makes a public or private API request.
     * @param  {String}   method   方法名 The API method (public or private)
     * @param  {Object}   params   Arguments to pass to the api call
     * @param  {Number}   retrysLeft
     * @return {Object}   The response object 重试请求的次数
     */
    private api;
    /**
     * 发送公共API请求
     * This method makes a public API request.
     * @param  {String}   instruction   The API method (public or private)
     * @param  {Object}   params        Arguments to pass to the api call
     * @return {Object}                 The response object
     */
    private publicMethod;
    /**
     * 发送私有API请求
     * This method makes a private API request.
     * @param  {String}   instruction The API method (public or private)
     * @param  {Object}   params      Arguments to pass to the api call
     * @return {Object}               The response object
     */
    private privateMethod;
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/get_balances
     */
    Balance(): Promise<BalanceResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/get_deposits
     */
    Deposits(params?: DepositsRequest): Promise<DepositsResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/get_deposit_address
     */
    DepositAddress(params: DepositAddressRequest): Promise<DepositAddressResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/get_withdrawals
     */
    Withdrawals(params?: WithdrawalsRequest): Promise<WithdrawalsResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Capital/operation/request_withdrawal
     */
    Withdraw(params: WithdrawRequest): Promise<void>;
    /**
     * https://docs.backpack.exchange/#tag/History/operation/get_order_history
     */
    OrderHistory(params?: OrderHistoryRequest): Promise<OrderHistoryResponse>;
    /**
     * https://docs.backpack.exchange/#tag/History/operation/get_fills
     */
    FillHistory(params?: FillHistoryRequest): Promise<FillHistoryResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_assets
     */
    Assets(): Promise<AssetsResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_markets
     */
    Markets(): Promise<MarketsResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_ticker
     */
    Ticker(params: TickerRequest): Promise<TickerResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_depth
     */
    Depth(params: DepthRequest): Promise<DepthResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Markets/operation/get_klines
     */
    KLines(params: KLinesRequest): Promise<KLinesResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/get_order
     */
    GetOrder(params: GetOrderRequest): Promise<GetOrderResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/execute_order
     */
    ExecuteOrder(params: ExecuteOrderRequest): Promise<ExecuteOrderResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/cancel_order
     */
    CancelOrder(params: CancelOrderRequest): Promise<CancelOrderResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/get_open_orders
     */
    GetOpenOrders(params?: GetOpenOrdersRequest): Promise<GetOpenOrdersResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Order/operation/cancel_open_orders
     */
    CancelOpenOrders(params: CancelOpenOrdersRequest): Promise<CancelOpenOrdersResponse>;
    /**
     * https://docs.backpack.exchange/#tag/System/operation/get_status
     */
    Status(): Promise<StatusResponse>;
    /**
     * https://docs.backpack.exchange/#tag/System/operation/ping
     */
    Ping(): Promise<PingResponse>;
    /**
     * https://docs.backpack.exchange/#tag/System/operation/get_time
     */
    Time(): Promise<TimeResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Trades/operation/get_recent_trades
     */
    RecentTrades(params: RecentTradesRequest): Promise<RecentTradesResponse>;
    /**
     * https://docs.backpack.exchange/#tag/Trades/operation/get_historical_trades
     */
    HistoricalTrades(params: HistoricalTradesRequest): Promise<HistoricalTradesResponse>;
    /**
      * https://docs.backpack.exchange/#tag/Streams/Private
      * @return {Object} Websocket     Websocket connecting to order update stream
      */
    subscribeOrderUpdate(): WebSocket;
}
export type Blockchain = "Solana" | "Ethereum" | "Polygon" | "Bitcoin";
export type SelfTradePrevention = "RejectTaker" | "RejectMaker" | "RejectBoth" | "Allow";
export type TimeInForce = "GTC" | "IOC" | "FOK";
export type OrderStatus = "Cancelled" | "Expired" | "Filled" | "New" | "PartiallyFilled" | "Triggered";
export type LimitOrder = {
    orderType: "limit";
    id: string;
    clientId?: number;
    symbol: string;
    side: "Bid" | "Ask";
    quantity: number;
    executedQuantity: number;
    quoteQuantity: number;
    executedQuoteQuantity: number;
    triggerPrice?: number;
    timeInForce: TimeInForce;
    selfTradePrevention: SelfTradePrevention;
    status: OrderStatus;
    createdAt: number;
};
export type MarketOrder = {
    orderType: "market";
    id: string;
    clientId?: number;
    symbol: string;
    side: "Bid" | "Ask";
    quantity?: number;
    executedQuantity: number;
    quoteQuantity?: number;
    executedQuoteQuantity: number;
    triggerPrice?: number;
    timeInForce: TimeInForce;
    selfTradePrevention: SelfTradePrevention;
    status: OrderStatus;
    createdAt: number;
};
export type BalanceResponse = {
    [property: string]: {
        available: number;
        locked: number;
        staked: number;
    };
};
export type DepositsRequest = {
    limit?: number;
    offset?: number;
};
export type DepositsResponse = {
    id: number;
    toAddress?: string;
    fromAddress?: string;
    confirmationBlockNumber?: number;
    providerId?: string;
    source: "administrator" | "solana" | "ethereum" | "bitcoin" | "nuvei" | "banxa" | "ioFinnet";
    status: "pending" | "cancelled" | "confirmed" | "expired" | "initiated" | "received" | "refunded";
    symbol: string;
    quantity: number;
    transactionHash?: string;
    createdAt: string;
}[];
export type DepositAddressRequest = {
    blockchain: Blockchain;
};
export type DepositAddressResponse = {
    address: string;
};
export type WithdrawRequest = {
    address: string;
    blockchain: Blockchain;
    clientId?: string;
    quantity: number;
    symbol: string;
    twoFactorToken: string;
};
export type OrderHistoryRequest = {
    limit?: number;
    offset?: number;
};
export type OrderHistoryResponse = {
    id: number;
    orderType: "Market" | "Limit";
    symbol: string;
    side: "Bid" | "Ask";
    price: number;
    triggerPrice: number;
    quantity: number;
    quoteQuantity: number;
    timeInForce: TimeInForce;
    selfTradePrevention: SelfTradePrevention;
    postOnly: boolean;
    status: OrderStatus;
}[];
export type FillHistoryRequest = {
    orderId?: string;
    symbol?: string;
    limit?: number;
    offset?: number;
};
export type FillHistoryResponse = {
    id: number;
    tradeId: number;
    orderId: number;
    symbol: string;
    side: "Bid" | "Ask";
    price: number;
    quantity: number;
    fee: number;
    feeSymbol: string;
    isMaker: boolean;
    timestamp: string;
}[];
export type WithdrawalsRequest = {
    limit?: number;
    offset?: number;
};
export type WithdrawalsResponse = {
    id: number;
    blockchain: Blockchain;
    clientId?: string;
    identifier?: string;
    quantity: number;
    fee: number;
    symbol: string;
    status: "pending" | "confirmed" | "verifying" | "void";
    toAddress: string;
    transactionHash?: string;
    createdAt: string;
}[];
export type AssetsResponse = {
    symbol: string;
    tokens: {
        blockchain: Blockchain;
        depositEnabled: boolean;
        minimumDeposit: number;
        withdrawEnabled: boolean;
        minimumWithdrawal: number;
        maximumWithdrawal: number;
        withdrawalFee: number;
    }[];
}[];
export type MarketsResponse = {
    symbol: string;
    baseSymbol: string;
    quoteSymbol: string;
    filters: {
        price: {
            minPrice: number;
            maxPrice?: number;
            tickSize: number;
        };
        quantity: {
            minQuantity: number;
            maxQuantity?: number;
            stepSize: number;
        };
        leverage?: {
            minLeverage: number;
            maxLeverage: number;
            stepSize: number;
        };
    };
}[];
export type TickerRequest = {
    symbol: string;
};
export type TickerResponse = {
    symbol: string;
    firstPrice: number;
    lastPrice: number;
    priceChange: number;
    priceChangePercent: number;
    high: number;
    low: number;
    volume: number;
    trades: number;
};
export type DepthRequest = {
    symbol: string;
};
export type DepthResponse = {
    asks: [number, number][];
    bids: [number, number][];
    lastUpdated: number;
};
export type KLinesRequest = {
    symbol: string;
    interval: "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "8h" | "12h" | "1d" | "3d" | "1month";
    startTime?: number;
    endTime?: number;
};
export type KLinesResponse = {
    start: string;
    open?: string;
    high?: string;
    low?: string;
    close?: string;
    end?: string;
    volume?: string;
    trades?: string;
};
export type GetOrderRequest = {
    clientId?: number;
    orderId?: string;
    symbol: string;
};
export type GetOrderResponse = LimitOrder | MarketOrder;
export type ExecuteOrderRequest = {
    clientId?: number;
    orderType: "Limit" | "Market";
    postOnly?: boolean;
    price?: number;
    quantity?: number;
    quoteQuantity?: number;
    selfTradePrevention?: SelfTradePrevention;
    side: "Bid" | "Ask";
    symbol: string;
    timeInForce?: TimeInForce;
    triggerPrice?: number;
};
export type ExecuteOrderResponse = LimitOrder | MarketOrder | {
    id: string;
};
export type CancelOrderRequest = {
    clientId?: number;
    orderId?: string;
    symbol: string;
};
export type CancelOrderResponse = LimitOrder | MarketOrder | {
    id: string;
};
export type GetOpenOrdersRequest = {
    symbol?: string;
};
export type GetOpenOrdersResponse = (LimitOrder | MarketOrder)[];
export type CancelOpenOrdersRequest = {
    symbol: string;
};
export type CancelOpenOrdersResponse = (LimitOrder | MarketOrder)[];
export type StatusResponse = {
    status: "Ok" | "Maintenance";
    message?: string;
};
export type PingResponse = "pong";
export type TimeResponse = number;
export type RecentTradesRequest = {
    symbol: string;
    limit?: number;
};
export type RecentTradesResponse = {
    id: number;
    price: number;
    quantity: number;
    quoteQuantity: number;
    timestamp: number;
    isBuyerMaker: boolean;
}[];
export type HistoricalTradesRequest = {
    symbol: string;
    limit?: number;
    offset?: number;
};
export type HistoricalTradesResponse = {
    id: number;
    price: number;
    quantity: number;
    quoteQuantity: number;
    timestamp: number;
    isBuyerMaker: boolean;
}[];
