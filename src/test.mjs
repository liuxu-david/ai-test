import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';

const model = new ChatOpenAI({
    model: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    // temperature: 0,    
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});
// const messages = [new HumanMessage('深圳北站附近的酒店，以及去的路线,并在本地创建个"规划路线.md"文件写入到当前目录下，如果写入不了你就直接告诉我就行')];
// const messages = [new HumanMessage('你不是大模型嘛，没接入tool和mcp不是无法执行一些操作吗')];
const messages = [new HumanMessage('光光是个怎么样的孩子？')];
const res = await model.invoke(messages);
console.log("🚀 ~ res:", res.content)
// 读文件工具
// const readFileTool = tool(
//     async ({ path }) => {
//         try {
//             return await readFile(path, 'utf-8');
//         } catch (err) {
//             // 把错误作为结果返回给模型，让它自己决定下一步（换个路径/告知用户）
//             return `读取失败: ${err.message}`;
//         }
//     },
//     {         
//         name: 'read_file',
//         description: '读取本地文本文件的内容。',
//         schema: z.object({
//             path: z.string().describe('要读取的文件路径，相对路径或绝对路径'),
//         }),
//     }
// );

// 把工具绑定到模型上，模型就知道自己"手上有锤子"可用
// const modelWithTools = model.bindTools([readFileTool]);

// const messages = [new HumanMessage('帮我读一下 package.json，这个项目用了哪些依赖？')];

// 工具调用循环：模型发起调用 → 执行工具 → 结果喂回模型 → 直到给出最终回答
// for (let step = 0; step < 5; step++) {
//     const res = await modelWithTools.invoke(messages);
//     messages.push(res);

//     // 没有 tool_calls，说明模型给出的是最终答案
//     if (!res.tool_calls?.length) {
//         console.log(res.content);
//         break;
//     }

//     for (const tc of res.tool_calls) {
//         console.log(`→ 模型调用工具: ${tc.name}(${JSON.stringify(tc.args)})`);
//         // tool.invoke(ToolCall) 返回的就是带 tool_call_id 的 ToolMessage，直接 push 即可
//         const toolMsg = await readFileTool.invoke(tc);
//         console.log(`← 工具返回: ${String(toolMsg.content).slice(0, 100)}...`);
//         messages.push(toolMsg);
//     }
// }