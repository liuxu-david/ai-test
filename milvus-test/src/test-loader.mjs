import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EPubLoader } from '@langchain/community/document_loaders/fs/epub';

// 和 book.insert.mjs 相同的定位方式
const EPUB_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '西游记.epub');
console.log('解析出的路径:', EPUB_FILE);
console.log('启动目录 cwd:', process.cwd(), '\n');

const docs = await new EPubLoader(EPUB_FILE, { splitChapters: true }).load();
console.log(`✓ 加载成功，共 ${docs.length} 个章节`);
const nonEmpty = docs.filter(d => d.pageContent.trim().length > 0);
const totalChars = nonEmpty.reduce((s, d) => s + d.pageContent.length, 0);
console.log(`非空章节: ${nonEmpty.length}，总字符数: ${totalChars}`);
console.log(`预计 500 字/块 会产生约 ${Math.ceil(totalChars / 450)} 个片段\n`);
console.log('第 5 章开头预览:');
console.log(docs[4]?.pageContent?.slice(0, 100));
