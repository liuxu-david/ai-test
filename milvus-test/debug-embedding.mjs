import { OpenAIEmbeddings } from '@langchain/openai';

const VECTOR_DIM = 1024;
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
  dimensions: VECTOR_DIM
});

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const diaries = [
  { id: 'diary_001', tags: ['生活', '散步'], content: '今天天气很好，去公园散步了，心情愉快。看到了很多花开了，春天真美好。' },
  { id: 'diary_002', tags: ['工作', '成就'], content: '今天工作很忙，完成了一个重要的项目里程碑。团队合作很愉快，感觉很有成就感。' },
  { id: 'diary_003', tags: ['户外', '朋友'], content: '周末和朋友去爬山，天气很好，心情也很放松。享受大自然的感觉真好。' },
  { id: 'diary_004', tags: ['学习', '技术'], content: '今天学习了 Milvus 向量数据库，感觉很有意思。向量搜索技术真的很强大。' },
  { id: 'diary_005', tags: ['美食', '家庭'], content: '晚上做了一顿丰盛的晚餐，尝试了新菜谱。家人都说很好吃，很有成就感。' }
];

function rank(docs, qv, label) {
  console.log(`\n  [${label}]`);
  docs
    .map(d => ({ id: d.id, sim: cosineSim(qv, d.vec) }))
    .sort((a, b) => b.sim - a.sim)
    .forEach((r, i) => console.log(`    ${i + 1}. [${r.sim.toFixed(4)}] ${r.id}`));
}

async function main() {
  const query = '我想看看关于学习的日记';
  const qv = await embeddings.embedQuery(query);
  console.log(`Query: "${query}"`);

  // 方案 A：现状，只 embed content
  const plainDocs = await Promise.all(diaries.map(async d => ({
    ...d, vec: await embeddings.embedQuery(d.content)
  })));
  rank(plainDocs, qv, 'A: 只 embed content（现状）');

  // 方案 B：embed 时把 tags 拼进去
  const taggedDocs = await Promise.all(diaries.map(async d => ({
    ...d, vec: await embeddings.embedQuery(`分类标签：${d.tags.join('、')}\n${d.content}`)
  })));
  rank(taggedDocs, qv, 'B: embed「tags + content」');

  // 顺便确认模型实际输出维度
  console.log(`\nembedding 维度: ${qv.length}`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
