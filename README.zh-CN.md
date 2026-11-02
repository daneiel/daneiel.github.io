# daneiel.github.io

[Português](README.md) · [English](README.en.md) · **中文** · [Русский](README.ru.md)

Daniel Souza 的个人网站，通过 GitHub Pages 发布于 **https://daneiel.github.io/**。纯静态 HTML、CSS 和 JavaScript，无需构建。

## 内容

| 路径 | 页面 | 来源 |
| --- | --- | --- |
| [`index.html`](index.html) | [作品集](https://daneiel.github.io/)：简介、项目、关于、设计令牌和联系方式 | 本仓库 |
| [`virapets/`](virapets/) | [ViraPets Studio](https://daneiel.github.io/virapets/)：像素风吉祥物创作工具（程序化绘制、本地照片转像素画、表情贴纸），可离线使用 | [viralabs-dev/virapets](https://github.com/viralabs-dev/virapets) · [指南](https://github.com/viralabs-dev/virapets/blob/main/site/README.md)（英文） |
| `/brabo/` | [Brabo 文档](https://daneiel.github.io/brabo/) | 由 [daneiel/brabo](https://github.com/daneiel/brabo) 仓库自行发布 |

## 本地运行

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000/ 和 http://localhost:8000/virapets/
```

## 发布

GitHub Pages 从 `main` 分支根目录提供服务。推送到 `main` 即发布网站。

## 许可证

ViraPets Studio 采用 MIT 许可证（[`virapets/LICENSE`](virapets/LICENSE)）；机器学习库的声明位于 `virapets/vendor/`。
