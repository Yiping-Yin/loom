# LOOM · START HERE（先读这个）

> 进这个仓库,先读本文件。它是**导航图**:该读什么、按什么顺序、以及新旧框架的关系。更新 2026-07-10。

## LOOM 是什么（一句话）

当 AI 让执行变免费,LOOM 把你唯一抄不走的东西——**判断力**——费力逼出、攒成只属于你的数据、长成一个按你判断行事的分身。(完整见第 0 层)

## ⚠️ 先说清:仓库里有两套框架

- **当前定稿（新 thesis）** = 判断护城河 / 费力回路 / gate 滩头。就是下面**第 0 层 + 第 0.5 层**那四份。**冲突一律以它们为准。**
- **旧框架**(学习基座 / Sources-Studio-Digital Me / Compile)= 仍在 `docs/canon/` + `plans/` + `docs/projects/active/`,是**现有代码库建成的样子**,有工程参考价值,但**产品叙事已过时**。已过时的顶层文档都加了"⚠️ 已过时"横幅。

---

## 阅读顺序

**第 0 层 · 战略(先定方向,别跳)**
1. [`NORTH_STAR.md`](NORTH_STAR.md) — 一页版 thesis + 三个生死缺口
2. [`docs/LOOM_STATE.md`](docs/LOOM_STATE.md) — 定稿总纲(愿景/架构/发展/核心问题诚实回答)
3. [`docs/COMMERCIAL_VALIDATION.md`](docs/COMMERCIAL_VALIDATION.md) — 商业现实与证据(留存闸 / A→B 滩头 / gate+雇主买单)。**读它是为了不自欺。**

**第 0.5 层 · 怎么建新 thesis(缺的那座桥)**
4. [`docs/LOOM_ENGINEERING_SPEC.md`](docs/LOOM_ENGINEERING_SPEC.md) — JudgmentUnit 数据模型 · 费力回路六步 · v0 concierge→v1 边界 · 三个验证闸 · 复用现有代码库的映射

**第 1 层 · 现有产品是什么(工程 canon,旧框架但权威)**
5. `docs/canon/WHAT_IS_LOOM.md` → `docs/canon/LOOM.md`(顶部有 THESIS UPDATE 横幅)→ `docs/canon/LOOM_RULES.md`(红线/否决项)→ `docs/canon/LOOM_USER_PROFILE.md` → `docs/canon/PROJECT_MAP.md`

**第 2 层 · 现在建到哪、怎么接着建**
6. `docs/REPO_STRUCTURE.md` · `docs/projects/active/`(看最新的 `2026-06-27-...user-stories` / `...skeleton-implementation-plan` / `...completion-audit` / `...handoff` / `...acceptance-status`)

**第 3 层 · 真动手写某一块时**
7. `plans/`(`compile-pipeline-mvp` · `loom-ai-passes` · `loom-cmd-k-palette` · `loom-cli` · `loom-camp-c-editable-render` · `phase-c-presentation-layer`)· `docs/canon/` 的设计纪律 · `docs/design/`

**别读(已过时,已加横幅):** `README.md` · `docs/loom.md` · `docs/loom-v5-roadmap.md` · `docs/loom-v5-phase3-plan.md` · `plans/loom-unified-product-vision.md`

---

## ⛔ 动手建之前（硬提醒）

新 thesis 的核心(判断能否变成比 memory 值钱的数据 / 谁付钱 / 冷启动)**今天全是【假设·未证】**。所以:

1. **先跑 `ENGINEERING_SPEC §6` 的 v0 concierge**(人肉、近零代码),验三个生死闸 + 留存;**闸不过,不建 v1。**
2. **owner 先拍滩头**(gate-attached 二选一:高风险技术/quant/case 面试准备,或卖方初级分析师训练)——它 gates 下游一切。
3. 现有 `canon/` + `plans/` 是旧框架产品;要建新 thesis,以 `ENGINEERING_SPEC` 为准、复用其 §8 的部件映射。

---

*文档闭环:NORTH_STAR(为什么)→ LOOM_STATE(是什么)→ COMMERCIAL_VALIDATION(现实)→ ENGINEERING_SPEC(怎么建 + 先验什么)。本文件只负责把你引到对的那一份。*
