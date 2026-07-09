# LOOM · 工程规格（新 thesis → 可建）

> **2026-07-10。** 这份文档是缺失的那座桥:把收敛后的**新 thesis**(判断捕获 / 费力回路 / gate 滩头)翻成**可以动手建**的东西。
> 上游:[`../NORTH_STAR.md`](../NORTH_STAR.md)(一页版)· [`LOOM_STATE.md`](LOOM_STATE.md)(总纲)· [`COMMERCIAL_VALIDATION.md`](COMMERCIAL_VALIDATION.md)(证据)。
> 与旧工程 canon 的关系:`docs/canon/LOOM.md` 描述的是**旧框架产品**(学习基座 / Compile);本文件**重新瞄准**其中可复用的部件(见 §8),冲突处以本文件 + NORTH_STAR 为准。
>
> **成色标注**:**【证据】** ｜ **【定位赌注】**(非实证) ｜ **【假设·未证】**(设计假设,必须先验)。导师 Benson:*make it concrete。*
>
> ## ⛔ 造之前先读这条(否则会白建)
> 整套机制的核心(判断能否被逼成比 memory 值钱的数据、有没有人付钱、冷启动)**今天全是【假设·未证】**。所以**第一步不是建自动化产品,是跑 §6 的 v0 concierge**(人肉、近零代码)去验那三个闸 + 留存。**闸不过,不建 v1。** 本 spec 把 v1 写好,是为了闸一过就能立刻动手,不是让你现在就写全套。

---

## 1. 要造的东西(一句话 + 边界)

**一个"费力判断回路"**:你带一个硬东西进来,一个**对抗性 AI 陪练**逼你对它下判断、并在压力下辩护;过程里你的每一次判断被**结构化捕获成专有数据**(JudgmentUnit),累积成一个"你怎么判断"的档案,最终长成一个按你判断行事的 agent。

**滩头(A→B 研究的结论,owner 需拍一个)**:必须**挂靠一个硬外部 gate + 有雇主/高 ROI 买家**(纯"个人为被逼着思考付钱"= 墓地,见 COMMERCIAL_VALIDATION)。两个最干净的候选:
- **(1) 高风险技术/quant/case 面试准备** —— gate 干净、WTP 已被 LeetCode/UWorld 证明、有敌对考官、查不到答案、每日习惯已存在。
- **(2) 卖方初级分析师的判断力上手训练** —— 雇主 L&D 付费、判断半公开无 alpha 泄漏。

本 spec 的**核心机制写成 gate 无关**;`{{GATE}}` / `{{MATERIAL}}` 是占位符,选定滩头后填。**这个选择 gates 下游一切**(材料类型、回路为哪个时刻排练、买家是谁)。

**不是**:不是聊天、不是摘要器、不是笔记 App、不是知识库。

---

## 2. 核心数据模型:JudgmentUnit（"判断作为数据",必须打得过 memory）

**存储【定位/工程约束】**:每条 JudgmentUnit 是一个**用户 own 的 markdown 文件**(YAML frontmatter + 正文),落在 `LoomFileStore`,可导出、不用于训练。

```markdown
---
id: ju_2026-07-10T09-31_a3f
session: ses_2026-07-10_0928
gate: "{{GATE}}"                 # 为哪个高风险时刻排练,如 interview:distributed-training
material:
  type: paper | spec | concept | doc | case
  ref: <url / file / anchor>
  excerpt: "遇到的那段硬材料"
prompt: "回路逼你决定/重构的那句话"
verdict: agree | reject | conditional | reframe
verdict_detail: "对,但仅在 X 下 / 我认为关键其实是 Y"
kept:  ["你判定为承重的点", "..."]      # 你的取舍(留)
cut:   ["你判定为噪音/兔子洞的点", "..."] # 你的取舍(砍)——信息量最大
application: "你会怎么用它 / 它在哪失效"
confidence: 0.0-1.0
confidence_why: "为什么这个信心水平"
challenged_on: ["陪练反驳你的点"]        # 判断在压力下暴露的地方
held_or_revised: held | revised
domain: <ml / quant / law / ...>
created_at, provider, effort_ms          # effort_ms = 这条花的费力时长(反-cheap 的度量)
---

# 你的重构（用你自己的话把这块知识/判断重新表达，长文，可编辑）
```

**派生:JudgmentProfile(= 判断数据层,§4)**——把一堆 JudgmentUnit 聚合成"你这个人的判断模型":反复出现的取舍模式、你的信心校准(哪些领域你过/欠自信)、你的重构风格、领域覆盖。它是喂 agent 的训练信号。

**为什么这可能比 ChatGPT memory 值钱【假设·未证 —— §6 坑1 要验】**:memory 是从闲聊里**被动抽取**的事实;JudgmentUnit 的每个字段都是**被主动逼出的、结构化的立场**(表态 verdict + 取舍 kept/cut + 重构 + 压力下 held/revised)。假设是:这种"被费力逼出的、带取舍和辩护的判断",作为"训一个像你一样判断的 agent"的信号,**质量远高于聊天记录**。**这条没被证明前,别把它当既成事实。**

---

## 3. 核心回路的交互规格（六步,做到可实现）

| 步 | 用户动作 | AI 行为(系统约束) | 捕获什么 |
|---|---|---|---|
| ① 带入 | 粘贴/捕获一段 `{{MATERIAL}}` + 声明"为哪个 gate 排练" | — | 新建 session,记 gate |
| ② 先表态 | 先说"这对不对?关键在哪?" | **硬约束:解释前绝不给答案**,只抛问题逼你先下判断 | JudgmentUnit 草稿(初始 verdict) |
| ③ 对抗陪练 | 你答,它质疑,你再答 | **系统提示见下。角色=挑战者,不是神谕。绝不替你下结论、绝不直接给标准答案。** 实时(语音/文字) | challenged_on、held/revised |
| ④ 随手标 | 标 承重/兔子洞/接受/否定/怎么用 | 把标注结构化进 JudgmentUnit | kept / cut / application |
| ⑤ 重构+织 | 用自己的话重写 | **只排版你写的,绝不加内容**(道德风险铁律),织成一页 crafted、归你的 paper-canon 成品 | 你的重构(正文) |
| ⑥ 累积 | — | JudgmentUnit → JudgmentProfile | 复利 |

**③ 对抗陪练的系统提示草案【假设·未证,需调】**:
```
你是一个对抗性思考陪练,不是老师、不是助手、不是标准答案机。
你的任务是逼出并检验用户对这段材料的判断。
规则(硬):
- 用户对某点表态之前,绝不替他解释或给结论。
- 质疑、反驳、举反例、追问"为什么"、指出他没考虑的边界。
- 绝不替用户下最终判断。判断永远是用户的。
- 发现他浅了/套路化了,直接点破(这正是他去 {{GATE}} 会被当场揭穿的地方)。
- 保持在这段材料 + 用户此前的 JudgmentUnit 上下文里。
目标不是让他舒服,是让他在真 gate 之前,先在你这儿被揭穿一次。
```
> 这是对现有 Ask AI(canon 里是"curiosity-led 的老师")的**重新瞄准**——从"有求必应的老师"改成"对抗性陪练"。是产品性格的根本反转,§8 标了冲突。

---

## 4. 三层 → 工程组件

- **捕获层 · The Loop** = 材料接入 + ②③ 对抗陪练引擎 + ④ JudgmentUnit 捕获 UI + ⑤ crafted-page 渲染。
- **判断数据层 · Judgment Data** = JudgmentUnit 存储(markdown) + JudgmentProfile 构建器(对判断做检索/嵌入,而非对笔记)。
- **分身层 · Agent**【全部 deferred,非 MVP】= 一个**判断-条件化的上下文层**:把 JudgmentProfile + 相关 JudgmentUnit 拼进 prompt,喂给前沿模型,让它"按你的判断"回答/行动。**明确不是微调个人权重**(见 NORTH_STAR 坑1 的现实版本);是检索+上下文编排。

---

## 5. MVP 边界（v0 concierge → v1 built）

### v0 · Concierge（第一步,近零代码,先验闸——见 §6）
- 找 **5–10 个 gate-attached 用户**(选定滩头的那类人)。
- **你(人肉)当对抗陪练**跑 ②③④⑤,**手工**把每条判断记成 JudgmentUnit(就用上面的 markdown 模板)。
- 目的:验 §6 三个闸 + 留存。**不写产品代码。**

### v1 · Built（**仅当 v0 过闸**才建)
- 自动化回路,**锁死一个滩头 + 一种 `{{MATERIAL}}` 类型**。
- **做**:材料接入 · 对抗陪练引擎(③ 的系统提示) · JudgmentUnit 捕获 UI(②④) · crafted-page 织出(⑤) · JudgmentProfile 存储与检索。
- **不做**:agent(分身层)· 多领域 · 多人协作 · 移动端 · 跨 session 的深度个性化。

### Deferred
分身/agent、JudgmentProfile 的深度建模、多人协作楔子(注:研究说这是"能爬上企业"的最强预测因子,值得早想但不在 v1)、跨领域。

---

## 6. 三个 make-or-break 缺口 = 造之前必须过的验证闸（具体实验）

**这是全文最重要的一节。三个闸任一不过,不进 v1。**

1. **坑1 · 判断 > memory?**【生死闸】
   实验:同一用户、同一问题,拿"由他的 JudgmentUnit 条件化的回答" vs "由他的 ChatGPT memory / 通用回答"做**盲测**,看他更偏好哪个、以及是否明显"更像他自己会给的判断"。
   过:匹配版盲测胜率明显更高(如 ≥70%)。砍:分不出差别 → 判断数据不比 memory 值钱 → thesis 塌。
2. **坑2 · 谁付钱?**
   实验:向 gate-attached 买家(雇主 L&D,或直面 gate 的个人)要**预付/定金/LOI**。
   过:10 个里 ≥3 个真掏钱/押金。砍:都说"不错"但没人付 → 回到定位。
3. **坑3 · 冷启动(回路本身独立值钱吗)?**
   实验:在**还没有 agent** 的情况下跑 v0,看用户是否因为"回路本身让我在 {{GATE}} 前不翻车/真搞懂了"而**第三周还自己回来**。
   过:≥一半第三周自发回来。砍:不回来 → 高频习惯立不住,飞轮启动不了。

---

## 7. 横贯硬约束（工程层面必须编码,不是口号）

- **Power of Effort**:系统**永不自动给答案、永不替用户下判断**(②③⑤ 的硬约束)。effort_ms 被记录,作为反-cheap 的产品信号。【教学侧有【证据】(desirable difficulty);价值侧【定位赌注】】
- **数据所有权**:JudgmentUnit = 用户 own 的 markdown、可导出、**不用于训练**(复用 `LoomFileStore` 的主权模型)。【定位/工程】
- **反平台**:价值是"这一个人的判断";**不跨用户汇集原始判断**(隐私)。【定位赌注】
- **道德风险铁律**:agent 是**镜子/放大器,永不替身**;回路里最终判断**永远由人做**。一旦系统替用户判断,就制造了它要治的病(NORTH_STAR moral hazard)。这条编码进 ③⑤ 的约束里。

---

## 8. 与现有代码库的关系（复用 / 新建 / 冲突）

> 以下"已建"依据 `docs/canon/LOOM.md §6`(8 块拼图状态)。动手前请对着 `docs/REPO_STRUCTURE.md` + `docs/projects/active/` 最新审计核实。

**复用(已建,直接接)**:
- **Web Capture 扩展 + 捕获宿主** → 材料接入(①)。
- **paper canon 渲染** → crafted-page(⑤)+ 阅读面。
- **page body scratch** → 重构输入(⑤)。
- **LoomFileStore(markdown)** → JudgmentUnit 存储(所有权)。
- **callAiPrompt 多provider** → 陪练(③)+ 织(⑤)的模型调用。

**重新瞄准(部件在,语义变)**:
- **Ask AI / LoomAIBar**:从"curiosity-led 老师" → **对抗性陪练**(③ 的新系统提示)。产品性格根本反转。
- **Compile pipeline(canon 里"未建")**:从"给你的草稿排版的 typesetter" → **"把你辩护过的判断织成 crafted 成品"**。→ `plans/compile-pipeline-mvp.md` 与 `plans/loom-ai-passes.md` 需按本 spec 重新 scope。

**新建**:
- JudgmentUnit schema + 存储 + 捕获 UI(②④)。
- 对抗陪练引擎(③ 系统提示 + "不给答案/不替你判断"约束)。
- JudgmentProfile 构建器(对判断做检索/嵌入;可复用 canon Tier5 的 `LoomEmbeddingStore` 思路,但对象是判断不是笔记)。
- "声明 gate / 一次 rep" 的框架。

---

## 9. 诚实结语

这份 spec **全部立在【假设·未证】的核心上**:判断能否被逼成比 memory 值钱的数据、有没有人为它付钱、回路本身够不够撑留存——三条今天都没证。所以:

1. **先跑 §6 的 v0 concierge**,不写 v1 代码;
2. **owner 先拍滩头**(那两个 gate-attached 候选选一个)——它 gates 一切;
3. 三个闸过了,再照 §5 v1 动手,复用 §8 的部件。

**闸不过,变的不是这份 spec,是整个 thesis。** 这不是悲观,是把"完整落地"之前唯一要先赢的那几件事,写成了可执行的实验。
