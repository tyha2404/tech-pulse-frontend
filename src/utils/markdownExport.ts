import type { Article } from '../types';

export function generateArticleMarkdown(article: Article): string {
  const title = article.vietnamese_title || article.title;
  const originalTitle = article.title;
  const dateStr = article.published_at || article.created_at;
  const tagsList =
    article.tags && article.tags.length > 0
      ? article.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(', ')
      : '';

  let md = `---
title: "${title.replace(/"/g, '\\"')}"
source: "${(article.source_name || 'TechPulse').replace(/"/g, '\\"')}"
url: "${article.url}"
date: "${dateStr}"
relevance_score: ${article.relevance_score ?? 0}
reading_time: ${article.reading_time_minutes ?? 1}
tags: [${tagsList}]
---

# ${title}

> **Nguồn bài viết:** [${article.source_name || 'Original Source'}](${article.url})  
> **Tiêu đề gốc:** ${originalTitle}  
> **Điểm đánh giá AI:** ${article.relevance_score ? article.relevance_score.toFixed(1) : 'N/A'}/10  
> **Thời gian đọc dự kiến:** ${article.reading_time_minutes || 1} phút  
> **Ngày đăng:** ${dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'Mới cập nhật'}

---

## 📌 Tóm tắt cốt lõi cho kỹ sư
${article.vietnamese_summary || 'Chưa có tóm tắt chi tiết.'}

`;

  if (article.key_takeaways && article.key_takeaways.length > 0) {
    md += `## 💡 Bài học & Điểm kỹ thuật đáng chú ý (Key Takeaways)
${article.key_takeaways.map((item) => `- ${item}`).join('\n')}

`;
  }

  if (article.new_tech_stacks && article.new_tech_stacks.length > 0) {
    md += `## ⚡ Công nghệ mới xuất hiện
${article.new_tech_stacks
  .map((ts) => `- **${ts.name}**${ts.category ? ` (*${ts.category}*)` : ''}: ${ts.desc || 'N/A'}`)
  .join('\n')}

`;
  }

  const tf = article.architectural_tradeoffs;
  if (
    tf &&
    (tf.pros?.length ||
      tf.cons?.length ||
      tf.when_not_to_use?.length ||
      tf.scalability_bottlenecks?.length)
  ) {
    md += `## ⚖️ Đánh giá phản biện & Đánh đổi kiến trúc (Architectural Tradeoffs)

### Ưu điểm vượt trội (Pros)
${tf.pros && tf.pros.length > 0 ? tf.pros.map((p) => `- ✅ ${p}`).join('\n') : '- Đang cập nhật.'}

### Nhược điểm & Rủi ro (Cons)
${tf.cons && tf.cons.length > 0 ? tf.cons.map((c) => `- ⚠️ ${c}`).join('\n') : '- Đang cập nhật.'}

### Khi nào KHÔNG NÊN áp dụng
${tf.when_not_to_use && tf.when_not_to_use.length > 0 ? tf.when_not_to_use.map((w) => `- 🛑 ${w}`).join('\n') : '- Không có cảnh báo đặc biệt.'}

### Điểm nghẽn khi Scale (Scalability Bottlenecks)
${tf.scalability_bottlenecks && tf.scalability_bottlenecks.length > 0 ? tf.scalability_bottlenecks.map((b) => `- ⚡ ${b}`).join('\n') : '- Chưa phát hiện điểm nghẽn.'}

`;
  }

  const bp = article.nestjs_blueprint;
  if (
    bp &&
    (bp.architectural_pattern ||
      bp.suggested_module_structure ||
      bp.code_snippet ||
      bp.database_integration)
  ) {
    md += `## 🧱 Kiến trúc đề xuất & Blueprint

- **Architectural Pattern:** ${bp.architectural_pattern || 'Modular Pattern'}
${bp.suggested_module_structure ? `- **Module Structure:** \`${bp.suggested_module_structure}\`\n` : ''}${bp.database_integration ? `- **Database Integration:** ${bp.database_integration}\n` : ''}
`;
    if (bp.code_snippet) {
      md += `### Implementation Code
\`\`\`typescript
${bp.code_snippet}
\`\`\`

`;
    }
  }

  const lp = article.learning_path;
  if (lp && (lp.prerequisites?.length || lp.recommended_next_topics?.length)) {
    md += `## 🎯 Lộ trình học & Nghiên cứu tiếp theo
`;
    if (lp.prerequisites && lp.prerequisites.length > 0) {
      md += `### Kiến thức tiên quyết
${lp.prerequisites.map((p) => `- ${p}`).join('\n')}

`;
    }
    if (lp.recommended_next_topics && lp.recommended_next_topics.length > 0) {
      md += `### Chủ đề nên nghiên cứu tiếp
${lp.recommended_next_topics.map((t) => `- ${t}`).join('\n')}

`;
    }
  }

  md += `---
*Tài liệu được xuất tự động từ TechPulse AI Platform.*
`;

  return md;
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const safeName = filename.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80) || 'article';
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${safeName}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
