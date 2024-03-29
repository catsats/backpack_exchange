const tokenList = {
    message: `打赏：0x6afd87df0995b025cd4f4efc982f2944cdb53b83
    作者：https://twitter.com/zisan_xyz
    选择刷量的币种，会随机刷选择的代币。
  ！确保backpack有大于5USDC数量。
  ！确保选择的币种backpack有一定余额数量，否则会报错。
  ！如果刷wen，请确保backpack有一定数量的wen，其他代币同理。
  《按键盘空格是选择，回车是确认》
    `,
    choices: [
        {
            name: 'SOL_USDC',
            value: 'SOL_USDC',
            description: 'SOL_USDC',
        },
        {
            name: 'WEN_USDC',
            value: 'WEN_USDC',
            description: 'WEN_USDC',
        },
        {
            name: 'RENDER_USDC',
            value: 'RENDER_USDC',
            description: 'RENDER_USDC',
        },
        {
            name: 'WIF_USDC',
            value: 'WIF_USDC',
            description: 'WIF_USDC',
        },
        {
            name: 'JUP_USDC',
            value: 'JUP_USDC',
            description: 'JUP_USDC',
        },
        {
            name: 'BONK_USDC',
            value: 'BONK_USDC',
            description: 'BONK_USDC',
        },
        {
            name: 'PYTH_USDC',
            value: 'PYTH_USDC',
            description: 'PYTH_USDC',
        },
        {
            name: 'HNT_USDC',
            value: 'HNT_USDC',
            description: 'HNT_USDC',
        },
        {
            name: 'JTO_USDC',
            value: 'JTO_USDC',
            description: 'JTO_USDC',
        },
        {
            name: 'MOBILE_USDC',
            value: 'MOBILE_USDC',
            description: 'MOBILE_USDC',
        }
    ]
};

exports.tokenList = tokenList;