# 🌐 RosPanel (ROS Panel)

<p align="center">
  <a href="#english">English</a> •
  <a href="#中文说明">中文说明</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/RouterOS-v7.x_Ready-007ACC?style=for-the-badge&logo=mikrotik&logoColor=white" alt="RouterOS v7">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/i18n-English_%7C_中文-blue?style=for-the-badge&logo=google-translate&logoColor=white" alt="Dual Language i18n">
  <img src="https://img.shields.io/badge/Mobile-Responsive_Ready-success?style=for-the-badge&logo=apple&logoColor=white" alt="Mobile Ready">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Ready">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License">
</p>

---

<a name="english"></a>
## 📖 Overview (English)

**RosPanel** is a modern, lightweight, and responsive web management platform specifically engineered for **MikroTik RouterOS v7.x**. 

Built with **React 18**, **TypeScript**, **Tailwind CSS v4**, and **Express 5**, it communicates seamlessly with MikroTik routers via the official **RouterOS REST API**. It replaces or complements traditional WebFig and WinBox with a high-contrast NOC dashboard, touch-optimized mobile sliding drawer navigation, drag-and-drop firewall rule reordering, full dual-language internationalization, and a privacy-first stateless architecture.

---

### ✨ Key Features

- 🌐 **Full Dual-Language Internationalization (i18n)**:
  - 1-click seamless toggle between **English** and **简体中文** on both the Login screen and the top Navigation bar.
  - Complete 100% dictionary coverage across all 18 inner pages, modals, tooltips, and status badges with persistent browser preferences.
- 📊 **NOC Telemetry & Port Matrix Visualizer**:
  - Live hardware telemetry (CPU processor load, board temperature, input voltage, memory usage, NAND flash storage, uptime).
  - Physical Ethernet & SFP port matrix visualization with dynamic Link UP/DOWN indicators.
  - 1.5s real-time traffic sampling charts (Rx/Tx throughput powered by ECharts).
  - Public WAN IP detection, continuous connection uptime, and total accumulated bandwidth usage.
- 🛡️ **Firewall & NAT with Drag-and-Drop Reordering**:
  - Full CRUD management for both NAT port forwarding and Packet Filter rules.
  - **Intuitive HTML5 Drag-and-Drop**: Easily adjust rule priority with drag handles or one-touch `↑` / `↓` buttons, strictly respecting RouterOS first-match semantics.
- 📡 **Wi-Fi 6 & CAPsMAN Central Roaming Controller**:
  - Centralized management for dual-band 802.11ax radios, WPA2/WPA3-SAE encryption, and channel widths.
  - Real-time client perception with RSSI signal indicators and negotiated Tx/Rx data rates.
  - One-click Quick Setup wizard to synchronize SSIDs and credentials across all radio interfaces.
  - Seamless enterprise 802.11k/v/r roaming distribution via CAPsMAN.
- ⬆️ **RouterOS Firmware & RouterBOARD BIOS Upgrade**:
  - Cloud channel selection (`Stable`, `Long-term`, `Testing`, `Development`).
  - Online changelog retrieval, one-click firmware download, and graceful automated reboot.
  - RouterBOARD BIOS hardware firmware flashing with safety confirmations.
- 🔀 **Multi-Router Switcher & Device Book**:
  - Centralized management for multiple RouterOS devices across different subnets or remote branches.
  - Switch between active router targets with one click directly from the header navigation.
- 🌐 **WAN Dial-up & Dynamic DNS (DDNS)**:
  - PPPoE Client with 1-click redial, dynamic interface status, and DHCP Client inspection.
  - Integrated DDNS supporting both native **MikroTik Cloud DDNS** (`/ip/cloud`) and custom providers (Cloudflare, Aliyun, DNSPod, DuckDNS, Custom Webhooks).
- ⚡ **Wake-on-LAN (WoL)**:
  - Send magic packets to wake LAN devices directly through RouterOS ARP tables and custom device lists.
- 🔒 **Comprehensive WinBox Core Management Suite**:
  - **Static Routes**: Manage destination subnets, gateways, and distances.
  - **DNS Center**: Global caching settings, flush cache, and static DNS resolution (A records).
  - **DHCP Hub**: Client leases, DHCP servers, option networks, and IP address pools.
  - **WireGuard VPN**: Tunnel interface config, public keys, and Peer mesh management.
  - **QoS Bandwidth Limiting**: Simple Queues for client bandwidth caps and burst management.
  - **Diagnostics & Tools**: Built-in Ping, Traceroute hop visualizer, and Web CLI Terminal.
  - **System Backup**: Generate `.backup` snapshots and export `.rsc` configuration scripts.
  - **Access Control & Audit**: Full/Write/Read user management, password changes, and categorized logs.
- 📱 **100% Mobile & Tablet Compatible**:
  - Off-canvas responsive sliding drawer navigation with touch-outside dismissal.
  - Touch-friendly horizontal swiping for multi-tab panels and wide data tables.
  - Viewport-safe modal dialogs with keyboard collision protection.
- 🔐 **Privacy-First & Stateless Security**:
  - **Zero Database / Zero Disk Storage**: Credentials and router configurations are never written to the server's hard drive.
  - Client-side optional "Remember Password" operates strictly in your browser's local sandbox (`localStorage`).
  - Built-in **Demo Mode** allows instant testing without physical hardware.

---

### 🚀 Quick Start

#### Option 1: Docker Deployment (Recommended)

Run directly with Docker:
```bash
docker run -d \
  --name rospanel \
  -p 3001:3001 \
  --restart unless-stopped \
  maxend/ros-panel:latest
```

Or using `docker-compose.yml`:
```yaml
services:
  rospanel:
    image: maxend/ros-panel:latest
    container_name: rospanel
    restart: unless-stopped
    ports:
      - "3001:3001"
```

#### Option 2: Local Installation

##### Prerequisites
- Node.js `>= 18.0.0`
- pnpm `>= 8.0.0`
- A MikroTik device running **RouterOS v7.x** with REST API enabled:
  ```routeros
  /ip service set www-ssl disabled=no port=443
  # Or HTTP for internal management:
  /ip service set www disabled=no port=80
  ```

##### Build & Run
```bash
# Clone the repository
git clone https://github.com/max-end/ros-panel.git
cd ros-panel

# Install dependencies
pnpm install

# Build both client and server
pnpm build

# Start the production server (Default port: 3001)
pnpm start
```

Open your browser and navigate to `http://localhost:3001`. Enter your router's IP, port, and credentials to log in, or click **Quick Demo Mode** to preview with mock telemetry.

---

<a name="中文说明"></a>
## 📖 项目简介 (中文说明)

**RosPanel (ROS Panel)** 是专为 **MikroTik RouterOS v7.x** 打造的现代化、高颜值、全功能轻量级 Web 管理控制台。

基于 **React 18**、**TypeScript**、**Tailwind CSS v4** 与 **Express 5** 开发，通过 RouterOS 官方 **REST API** 与路由器底层无缝通信。旨在提供媲美顶级商业 SaaS 仪表盘的操作体验，彻底告别传统 WebFig 界面生硬、移动端无法操控的痛点，集成了深色科技感大屏、极简 2~4 字侧边栏、移动端原生抽屉、防火墙规则拖动排序、Wi-Fi 6 集中漫游控制及纯内存无状态安全架构。

---

### ✨ 核心功能特性

- 🌐 **全站双语无缝国际化 (Full i18n)**：
  - 登录页与顶部导航栏支持**简体中文**与 **English** 一键即时切换。
  - 全站 18 个核心页面、弹出表单、提示框、操作说明实现 100% 字典级本地化覆盖，自动记忆用户语言偏好。
- 📊 **NOC 运维级监控大屏 & 物理端口矩阵**：
  - 全局硬件健康指示（CPU 负载、主板温度、供电电压、内存与磁盘占用、开机运行时间）。
  - 物理网口可视化矩阵：实时呈现每个以太网口与 SFP 光口的 Link UP/DOWN 状态。
  - 1.5s 持续动态采样流量图表（基于 ECharts 的 Rx/Tx 入出吞吐折线图）。
  - WAN 公网 IP 自动侦测、持续在线时长与外网累计流量统计。
- 🛡️ **支持拖拽排序的防火墙与 NAT 管理**：
  - 端口映射 (Port Forwarding) 与过滤规则 (Filter Rules) 全生命周期增删改查。
  - **首创 HTML5 拖拽重排 (Drag & Drop)**：直观抓取规则行或点击 `↑` / `↓` 微调匹配次序，严格遵从 RouterOS 首条命中原则。
  - 序列标号与生效状态实时联动，自动兼容 RouterOS REST 与 CLI 回退机制。
- 📡 **Wi-Fi 6 & CAPsMAN 集中漫游控制器**：
  - 双频 Wi-Fi 6 (802.11ax) 射频配置、WPA3-SAE 安全加密及频宽选择。
  - 关联无线终端动态感知：实时展现终端信号强度 (RSSI) 与协商速率。
  - 极简快速配置向导：一键统一修改 2.4G 与 5G SSID 名称及密码。
  - CAPsMAN 集中控制器说明与 AP 节点集中下发，支持 802.11k/v/r 无缝漫游。
- ⬆️ **RouterOS 在线固件升级与硬件引导维护**：
  - 在线切换更新分支（`Stable` 稳定版、`Long-term` 长期支持版、`Testing` 测试版、`Development` 开发版）。
  - 官方更新日志智能检索、固件一键在线下发升级与优雅重启。
  - RouterBOARD 引导硬件 (BIOS) 固件安全刷写与设备硬件序列号核对。
- 🔀 **多节点路由器设备簿与极速切换**：
  - 支持保存多个不同内网或异地分支的 RouterOS 节点。
  - 顶部导航栏直观展示当前连通节点，支持一键无感切换控制目标。
- 🌐 **外网拨号 (WAN) 与动态域名 (DDNS)**：
  - PPPoE Client 状态监控与一键断线重拨；上级动态 IP (DHCP Client) 接入解析。
  - 动态域名中心：原生支持 **MikroTik 官方 Cloud DDNS** (`/ip/cloud`) 以及主流第三方服务商（Cloudflare, 阿里云, DNSPod, DuckDNS, 自定义 Webhook 脚本）。
- ⚡ **网络唤醒 (Wake-on-LAN)**：
  - 通过路由器局域网魔术包实现内网主机、NAS 与服务器的远程一键开机与在线探测。
- 🔧 **完备的 WinBox 核心网络管理套件**：
  - **静态路由**：路由表查询、添加默认网关与静态跃点策略。
  - **DNS 综合服务**：上游 DNS 配置、一键清空 DNS 缓存、内网静态域名 A 记录劫持与解析。
  - **DHCP 中心**：租约列表 (Leases) 快速固化、DHCP 服务端参数、下发网段设置、IP 地址池管理。
  - **WireGuard 组网**：隧道接口启停、公钥生成、对端节点 (Peers) 互联与 Allowed IPs 配置。
  - **QoS 流量限速**：Simple Queues 终端宽带限速与爆发速率调节。
  - **系统诊断工具箱**：内置 Ping 延迟测试、Traceroute 路由跳数跟踪及 Web CLI 命令行控制台。
  - **系统备份与导出**：一键生成全量 `.backup` 固件快照及导出可读的 `.rsc` 配置脚本。
  - **权限与日志审计**：管理员账户及 full/write/read 权限组配置，分类日志检索。
- 📱 **完美兼容手机与平板端访问**：
  - 响应式滑出式侧边抽屉与半透明暗色遮罩（点按汉堡按钮弹出，跳转自动收起）。
  - 选项卡栏横向指尖滑行，全站核心数据表格横向安全防挤压保护。
- 🔒 **纯净无状态，零硬盘持久化**：
  - **绝不收集或落地凭据**：服务器无任何数据库（无 SQLite/MySQL/MongoDB），会话纯内存维系，重启即销毁。
  - “记住账号密码”功能完全在用户个人浏览器端沙箱 (`localStorage`) 中运行。
  - 内置开箱即用的**演示模式 (Demo Mode)**，无需硬件即可体验所有功能。

---

### 🛠️ 技术选型 (Tech Stack)

| 领域 | 选型 | 说明 |
| :--- | :--- | :--- |
| **前端框架** | React 18 + TypeScript 5.7 | 组件化高内聚架构，强类型安全 |
| **构建工具** | Vite 6 | 秒级极速热重载与优化打包 |
| **样式体系** | Tailwind CSS v4 (`@tailwindcss/vite`) | 最新一代极速 CSS 引擎，Dark NOC 工业深色质感 |
| **国际化** | 响应式多语言上下文 (`i18n`) | 中英双语全覆盖，0 闪烁无缝切换与本地持久化 |
| **图标与图表** | Lucide Icons + ECharts 5 | 现代化极简矢量图标与流畅动态流折线图 |
| **后端运行** | Node.js 18+ / Express 5 | 轻量级高性能无状态 API 网关 |
| **硬件接口** | RouterOS v7 REST API + CLI Fallback | 官方标准协议，兼容所有 v7 固件架构 |

---

### 💻 快速安装与部署

#### 方式 1：Docker 容器化部署（推荐）

直接使用 Docker 命令启动：
```bash
docker run -d \
  --name rospanel \
  -p 3001:3001 \
  --restart unless-stopped \
  maxend/ros-panel:latest
```

或使用 `docker-compose.yml`：
```yaml
services:
  rospanel:
    image: maxend/ros-panel:latest
    container_name: rospanel
    restart: unless-stopped
    ports:
      - "3001:3001"
```

#### 方式 2：源码安装与启动

##### 1. 路由器端准备
登录您的 RouterOS 路由器，确认开启 Web / REST API 服务：
```routeros
# 启用 HTTPS REST API（推荐）
/ip service set www-ssl disabled=no port=443

# 或在受信任内网中使用标准 HTTP
/ip service set www disabled=no port=80
```

##### 2. 本地构建与启动
```bash
# 克隆本项目
git clone https://github.com/max-end/ros-panel.git
cd ros-panel

# 安装依赖
pnpm install

# 编译前后端工程
pnpm build

# 启动生产服务（默认端口：3001）
pnpm start
```

启动完成后，在浏览器访问 `http://<服务器IP>:3001` 即可开始使用！

---

### 🤝 贡献与支持 (Contributing & Support)

欢迎提交 Issue 和 Pull Request！如果您觉得这个项目对您管理 MikroTik 路由器有所帮助，请给项目点一个 **⭐️ Star**，这是对开源创作者最大的鼓励！

### 📄 开源许可证 (License)

本项目基于 [MIT License](LICENSE) 协议开源。
