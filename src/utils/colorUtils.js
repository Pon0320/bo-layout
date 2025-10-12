// src/utils/colorUtils.js

// 文字列から色を生成するシンプルなハッシュ関数
const categoryToColor = (category) => {
  if (!category) return '#a9d4ff'; // デフォルトの色

  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 明るいパステルカラーを生成するための調整
  const h = hash % 360; // 色相 (0-360)
  const s = 70 + (hash % 10); // 彩度 (70-80)
  const l = 80 + (hash % 10); // 明度 (80-90)

  return `hsl(${h}, ${s}%, ${l}%)`;
};

export { categoryToColor };