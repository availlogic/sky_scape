# 产品与技术架构规划：无限生成式纯前端 FPV 航拍模拟器

## 1. 产品概述（Product Overview）

本项目是一款基于现代浏览器图形 API（WebGPU / WebGL 2.0）开发的**纯前端（Frontend-only）、全生成式（Fully Generative）**无人机航拍视觉（FPV Drone Shot）模拟探索应用。

本应用的核心定位是**“模拟真实的自然环境，服务于风光航拍视觉体验”**。应用完全摒弃传统飞行模拟中繁琐的跑道起飞、降落以及座舱仪表盘等复杂过程，用户进入后即直接处于高空巡航状态（Mid-air Spawn）。通过纯前端数学噪声算法，应用能够实时生成无限延伸、完全随机但可复现（Deterministic）的自然世界。借助智能动态性能调节引擎，无论是在高性能电脑还是主流移动设备上，都能够尽可能维持稳定且流畅的 60 FPS 飞行体验。

整个世界不存在预先制作的地图、模型或场景资源，而是全部由算法实时生成，此理论上具有无限探索能力。

---

# 2. 产品设计原则（Product Design Principles）

整个项目遵循以下核心原则：

- **Frontend Only**：整个项目只有前端，没有任何后端服务。
- **Fully Generative**：所有地图、地形、植被、水体均实时生成，不依赖任何地图数据。
- **Asset-light**：尽量不使用大型模型、纹理或素材资源。
- **Offline Friendly**：首次加载完成后，可利用浏览器缓存进行离线体验。
- **High FPS First**：任何时候优先保证流畅度，而非画质。
- **Mobile First**：移动端和桌面端拥有一致的核心体验。
- **Zero Login**：无需注册、无需登录、无需账户系统。
- **Zero Backend Cost**：部署完成后几乎不存在服务器维护成本。

---

# 3. 核心功能模块（Core Features）

## 3.1 无人机航拍视角与全端交互控制（FPV Control & Input Mapping）

### 空中即时巡航

- 无起降逻辑。
- 默认生成于距离地表约 100~200 米高度。
- 摄像机具有惯性阻尼（Damping）。
- 支持平滑镜头运动。

### 多端操控

#### PC / Mac

- W / S
  - 前进
    - 后退

- A / D
  - 左右平移（Strafe）

- Q / E
  - 升高
    - 降低

- 鼠标移动
  - Pitch
    - Yaw

#### Mobile / Tablet

采用双虚拟摇杆。

左侧：

- 前进
- 后退
- 左右移动

右侧：

- 控制视角
- 看天
- 看地
- 左右旋转

右侧边缘：

- 高度滑杆

---

### 巡航速度控制

提供永久悬浮于屏幕边缘的速度滑杆。

例如：

- 5 m/s
- 10 m/s
- 20 m/s
- 30 m/s

用户可实时调整飞行速度，以适应不同的航拍节奏。

---

## 3.2 六大过程化生态（Six Procedural Biomes）

所有生态均采用数学噪声实时生成，并支持无限延伸。

### Desert

- 沙丘
- 雅丹
- 风蚀

---

### Forest

- 森林
- 草原
- 丘陵
- 大面积树木实例化

---

### Valley

- 峡谷
- 河床
- 悬崖

---

### Snowland

- 冰川
- 雪山
- 苔原

---

### Coastlines & Archipelago

新增：

- 海岸悬崖
- 群岛
- Gerstner Wave 海浪
- 浪花效果

---

### Badlands & Canyons

新增：

- 丹霞
- 红岩
- 地层纹理
- 峡谷

全部颜色均由 Shader 计算生成。

---

## 3.3 天气系统（Weather）

默认：晴天

后续版本支持：

- 多云
- 日落
- 夜晚
- 雾天
- 雨天
- 雪天

天气不会影响飞行，仅影响视觉效果。

---

## 3.4 光照系统（Lighting）

采用真实太阳方向。

包括：

- Directional Light
- Ambient Light
- Sky Gradient
- Atmospheric Scattering

后续支持：

- Golden Hour
- Blue Hour

---

## 3.5 自适应画质降级（Adaptive Degradation Engine）

后台持续检测 FPS。

当性能不足时自动降级。

### Level 1

- 减少 Render Distance
- 增加 Fog

---

### Level 2

动态分辨率：

例如：

- 100%
- 75%
- 50%

---

### Level 3

进一步降低：

- LOD
- Tree Density
- Shadow
- Reflection

确保飞行始终保持流畅。

---

# 4. 核心性能指标（Performance Metrics）

| 指标 | 目标 |
|------|------|
| FPS | 稳 60 FPS |
| 首屏加载 | <3 秒 |
| RAM | <500 MB |
| VRAM | <256 MB |
| 手机运行 | 满帧连续运行约15分钟 |

---

# 5. 技术架构（Technical Architecture）

## 图形引擎

推荐：

- Three.js（优先）
- Babylon.js（可选）

---

## 图形 API

优先：

- WebGPU

自动降级：

- WebGL 2

---

## 数学算法

包括：

- Simplex Noise
- FBM
- Domain Warp
- Gerstner Wave
- Quaternion
- Vector3 Lerp

---

## Chunk Streaming

推荐：

每块：

64 × 64

PC：

8 × 8

最高：

12 × 12

手机：

3 × 3

或：

4 × 4

---

## 地形生成

宏观：

3 层低频噪声。

微观：

3 层高频噪声。

全部 GPU 实时计算。

---

# 6. Cloudflare Pages 部署要求（Deployment Requirements）

## 项目定位

本项目**必须能够直接部署至 Cloudflare Pages**，整个系统仅包含静态前端资源，不允许依赖任何后端服务。

部署目标包括：

- Cloudflare Pages
- Cloudflare CDN
- 全球静态资源分发

整个项目应做到真正意义上的**零服务器（Serverless Static Site）**。

---

## 前端限制

整个项目必须遵循以下原则：

- 不使用 Node.js Server
- 不使用 Express
- 不使用 NestJS
- 不使用 Java Spring Boot
- 不使用 Python Flask/FastAPI
- 不使用 PHP
- 不使用数据库
- 不使用 Redis
- 不使用 MongoDB
- 不使用 PostgreSQL
- 不使用 MySQL
- 不使用 Firebase
- 不使用 Supabase
- 不使用任何 WebSocket 服务
- 不使用任何需要长期运行的后端程序

所有逻辑全部运行于浏览器。

---

## 数据来源

整个应用不得依赖任何在线地图或地形服务。

禁止依赖：

- Google Maps
- Mapbox
- Cesium World Terrain
- OpenStreetMap 地形
- Bing Maps
- ArcGIS

整个世界完全由程序实时生成。

---

## 数据存储

所有用户设置均保存在浏览器本地。

推荐：

- LocalStorage
- IndexedDB

包括：

- 飞行速度
- 控制灵敏度
- 最近使用生态
- 画质设置
- 自定义参数

不上传任何用户数据。

---

## 网络请求

除首次加载静态资源外：

运行过程中原则上不再发生网络请求。

整个飞行过程无需联网。

---

## 构建要求

推荐：

- Vite
- TypeScript
- ES Modules

输出目录：

```
dist/
```

可直接部署至 Cloudflare Pages。

---

## 浏览器兼容

支持：

- Chrome
- Edge
- Safari
- Firefox（WebGL 模式）

优先：

WebGPU

自动降级：

WebGL 2

---

## PWA（可选）

建议支持：

- Progressive Web App
- Add to Home Screen
- Offline Cache
- Service Worker

首次访问后，可离线体验。

---

# 7. 非功能性要求（Non-functional Requirements）

## 可维护性

项目采用模块化架构。

推荐目录：

```
src/

components/

engine/

terrain/

biomes/

render/

controls/

physics/

ui/

utils/

shaders/

assets/
```

---

## 可扩展性

未来能够方便新增：

- 新生态
- 新天气
- 新光照
- 新 Shader
- 新飞行模式

无需修改已有核心架构。

---

## 可读性

全部代码采用：

- TypeScript
- ESLint
- Prettier

统一编码规范。

---

## AI 友好开发

整个项目需采用高度模块化设计，便于 AI（如 ChatGPT、Claude、Gemini 等）辅助开发。

要求：

- 单个文件职责明确。
- 避免超大型文件（建议单文件控制在 300～500 行以内）。
- 公共逻辑高度复用。
- Shader、数学算法、UI、渲染、控制器彼此解耦。
- 所有模块均应具备清晰命名和必要注释，方便 AI 理解与增量修改。

---

# 8. 开发目标

本项目最终目标是打造一个：

- 无限生成
- 高性能
- 极低资源占用
- 无后端
- 无服务器成本
- 可直接部署到 Cloudflare Pages
- 支持 PC 与移动端
- 接近原生游戏体验

的现代浏览器 FPV 航拍模拟器。

# 9. 版本说明
此版本不是MVP，而是GA级别的v1.0版。
