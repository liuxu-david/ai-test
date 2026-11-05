import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node';
import { OpenAIEmbeddings } from '@langchain/openai';

const COLLECTION_NAME = 'ai_diary';
const VECTOR_DIM = 1024;

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
  dimensions: VECTOR_DIM
});

const client = new MilvusClient({ address: 'localhost:19530' });

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function main() {
  await client.connectPromise;
  console.log('✓ Connected\n');

  // 1. 看看索引实际参数
  try {
    const idx = await client.describeIndex({ collection_name: COLLECTION_NAME, index_name: 'vector' });
    console.log('Index info:', JSON.stringify(idx.index_descriptions?.[0] ?? idx, null, 2), '\n');
  } catch (e) {
    console.log('describeIndex failed:', e.message, '\n');
  }

  // 2. 集合里到底有多少条数据（多次跑 init 会重复插入）
  const count = await client.count({ collection_name: COLLECTION_NAME });
  console.log(`Row count: ${count.data}\n`);

  // 3. 拉出全部数据，本地算精确 cosine 相似度（ground truth）
  const all = await client.query({
    collection_name: COLLECTION_NAME,
    filter: 'id != ""',
    output_fields: ['id', 'content', 'vector'],
    limit: 100
  });
  console.log(`Fetched ${all.data.length} rows from Milvus\n`);

  for (const q of ['我想看看关于学习的日记', '学习']) {
    console.log('='.repeat(60));
    console.log(`Query: "${q}"`);
    const qv = await embeddings.embedQuery(q);

    // 本地精确相似度排名
    const truth = all.data
      .map(r => ({ id: r.id, content: r.content, sim: cosineSim(qv, r.vector) }))
      .sort((a, b) => b.sim - a.sim);
    console.log('\n[Ground truth] 本地精确 cosine 排名:');
    truth.slice(0, 5).forEach((r, i) =>
      console.log(`  ${i + 1}. [${r.sim.toFixed(4)}] ${r.id} ${r.content.slice(0, 30)}`)
    );

    // Milvus 默认参数搜索
    const def = await client.search({
      collection_name: COLLECTION_NAME,
      vector: qv,
      limit: 5,
      metric_type: MetricType.COSINE,
      output_fields: ['id', 'content']
    });
    console.log('\n[Milvus 默认参数] 返回:');
    def.results.forEach((r, i) =>
      console.log(`  ${i + 1}. [${r.score.toFixed(4)}] ${r.id} ${r['content'].slice(0, 30)}`)
    );

    // Milvus 全量探测搜索
    const full = await client.search({
      collection_name: COLLECTION_NAME,
      vector: qv,
      limit: 5,
      metric_type: MetricType.COSINE,
      params: { nprobe: 1024 },
      output_fields: ['id', 'content']
    });
    console.log('\n[Milvus nprobe=1024] 返回:');
    full.results.forEach((r, i) =>
      console.log(`  ${i + 1}. [${r.score.toFixed(4)}] ${r.id} ${r['content'].slice(0, 30)}`)
    );
    console.log('');
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
