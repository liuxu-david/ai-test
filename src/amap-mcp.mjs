import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { MCPAdapter } from '@langchain/mcp-adapters';

const AMAP_API_KEY = process.env.AMAP_API_KEY;
if (!AMAP_API_KEY) {
    console.error('请先在高德开放平台 https://console.amap.com 申请一个「Web服务」类型的 Key，');
    console.error('然后在 .env.test 中添加一行: AMAP_API_KEY=你的key');
    process.exit(1);
}

const model = new ChatOpenAI({
    model: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

// 连接高德官方 MCP Server（Streamable HTTP 方式）
// 文档: https://lbs.amap.com/api/mcp-server/gettingstarted
const adapter = new MCPAdapter({
    servers: {
        amap: {
            url: `https://mcp.amap.com/mcp?key=${AMAP_API_KEY}`,
        },
    },
});

try {
    // MCP 工具会被自动转换成 LangChain 工具
    const tools = await adapter.listTools();
    console.log('高德 MCP 可用工具:', tools.map(t => t.name).join(', '), '\n');

    const agent = createAgent({ model, tools });

    const result = await agent.invoke({
        messages: [
            { role: 'user', content: '帮我查一下深圳北站附近的酒店，以及明天深圳的天气' },
        ],
    });
    console.log(result.messages.at(-1).content);
} finally {
    // 用完关闭连接
    await adapter.close();
}
