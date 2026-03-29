/**
 * API Provider Presets
 * 
 * Pre-configured templates for API Keys creation/edit UI.
 * Supports domestic (China) and international AI model providers.
 * 
 * Usage:
 *   import { API_PROVIDERS, getProviderById, validateApiKeyFormat } from './api-providers.js';
 */

export const API_PROVIDERS = {
  // ===== International Providers =====

  openai: {
    id: 'openai',
    name: 'OpenAI',
    name_zh: 'OpenAI',
    icon: '🤖',
    color: '#10a37f',
    website: 'https://platform.openai.com',
    description: 'GPT-4, GPT-3.5 models by OpenAI',
    description_zh: 'OpenAI GPT-4、GPT-3.5 系列模型',
    base_url: 'https://api.openai.com/v1',
    docs_url: 'https://platform.openai.com/docs/api-reference',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable, multimodal flagship model',
        description_zh: '最强多模态旗舰模型',
        context_window: 128000,
        input_price_per_1m: 5.0,
        output_price_per_1m: 15.0,
        currency: 'USD',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast, affordable small model',
        description_zh: '快速、经济的轻量模型',
        context_window: 128000,
        input_price_per_1m: 0.15,
        output_price_per_1m: 0.6,
        currency: 'USD',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Previous flagship with 128K context',
        description_zh: '上一代旗舰，支持128K上下文',
        context_window: 128000,
        input_price_per_1m: 10.0,
        output_price_per_1m: 30.0,
        currency: 'USD',
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Original GPT-4 with 8K context',
        description_zh: '原版GPT-4，8K上下文',
        context_window: 8192,
        input_price_per_1m: 30.0,
        output_price_per_1m: 60.0,
        currency: 'USD',
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective model',
        description_zh: '快速、经济的对话模型',
        context_window: 16385,
        input_price_per_1m: 0.5,
        output_price_per_1m: 1.5,
        currency: 'USD',
      },
    ],
    key_format: {
      pattern: '^sk-(proj-)?[A-Za-z0-9_-]{20,}$',
      placeholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: 'sk-proj-',
      example: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    headers: {
      'Authorization': 'Bearer {API_KEY}',
      'Content-Type': 'application/json',
    },
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    name_zh: 'Anthropic',
    icon: '🧠',
    color: '#d5a439',
    website: 'https://www.anthropic.com',
    description: 'Claude 3.5, Claude 3 models by Anthropic',
    description_zh: 'Anthropic Claude 3.5、Claude 3 系列模型',
    base_url: 'https://api.anthropic.com/v1',
    docs_url: 'https://docs.anthropic.com/claude/reference',
    models: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        description: 'Balanced performance and speed',
        description_zh: '均衡的性能与速度',
        context_window: 200000,
        input_price_per_1m: 3.0,
        output_price_per_1m: 15.0,
        currency: 'USD',
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Previous generation, excellent reasoning',
        description_zh: '上一代，卓越推理能力',
        context_window: 200000,
        input_price_per_1m: 3.0,
        output_price_per_1m: 15.0,
        currency: 'USD',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Fast, affordable, small model',
        description_zh: '快速、经济的轻量模型',
        context_window: 200000,
        input_price_per_1m: 0.8,
        output_price_per_1m: 4.0,
        currency: 'USD',
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Most capable, complex tasks',
        description_zh: '最强能力，适合复杂任务',
        context_window: 200000,
        input_price_per_1m: 15.0,
        output_price_per_1m: 75.0,
        currency: 'USD',
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        description: 'Fastest, most compact',
        description_zh: '最快，最轻量',
        context_window: 200000,
        input_price_per_1m: 0.25,
        output_price_per_1m: 1.25,
        currency: 'USD',
      },
    ],
    key_format: {
      pattern: '^sk-ant-api[01]-[-A-Za-z0-9_]{40,}$',
      placeholder: 'sk-ant-api01-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: 'sk-ant-api01-',
      example: 'sk-ant-api01-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    headers: {
      'x-api-key': '{API_KEY}',
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
  },

  // ===== Domestic (China) Providers =====

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    name_zh: '深度求索',
    icon: '🔮',
    color: '#3a1c7a',
    website: 'https://platform.deepseek.com',
    description: 'DeepSeek V3, DeepSeek Coder by DeepSeek AI',
    description_zh: '深度求索 DeepSeek V3、DeepSeek Coder 系列模型',
    base_url: 'https://api.deepseek.com/v1',
    docs_url: 'https://platform.deepseek.com/docs',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        name_zh: 'DeepSeek Chat',
        description: 'General purpose chat model, excellent reasoning',
        description_zh: '通用对话模型，推理能力出色',
        context_window: 64000,
        input_price_per_1m: 0.1,
        output_price_per_1m: 0.28,
        currency: 'USD',
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        name_zh: 'DeepSeek Coder',
        description: 'Specialized code generation and completion',
        description_zh: '专业代码生成与补全',
        context_window: 16000,
        input_price_per_1m: 0.14,
        output_price_per_1m: 0.28,
        currency: 'USD',
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        name_zh: '深度思考',
        description: 'Advanced reasoning model (o1-style)',
        description_zh: '高级推理模型（类o1）',
        context_window: 64000,
        input_price_per_1m: 0.55,
        output_price_per_1m: 2.19,
        currency: 'USD',
      },
    ],
    key_format: {
      pattern: '^sk-[a-f0-9]{32,}$',
      placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: 'sk-',
      example: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    headers: {
      'Authorization': 'Bearer {API_KEY}',
      'Content-Type': 'application/json',
    },
  },

  'aliyun-qwen': {
    id: 'aliyun-qwen',
    name: 'Alibaba Cloud Qwen',
    name_zh: '阿里云通义千问',
    icon: '☁️',
    color: '#ff6a00',
    website: 'https://help.aliyun.com/document_detail/272911.html',
    description: 'Qwen series by Alibaba Cloud (DashScope)',
    description_zh: '阿里云通义千问系列模型（DashScope）',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    docs_url: 'https://help.aliyun.com/document_detail/272911.html',
    models: [
      {
        id: 'qwen-plus',
        name: 'Qwen Plus',
        name_zh: '通义千问Plus',
        description: 'High performance, long context',
        description_zh: '高性能，长上下文',
        context_window: 131072,
        input_price_per_1m: 0.8,
        output_price_per_1m: 2.4,
        currency: 'CNY',
        price_cny_note: '约 $0.11 / $0.33 per 1M tokens',
      },
      {
        id: 'qwen-max',
        name: 'Qwen Max',
        name_zh: '通义千问Max',
        description: 'Most capable Qwen model',
        description_zh: '最强千问模型',
        context_window: 131072,
        input_price_per_1m: 20.0,
        output_price_per_1m: 60.0,
        currency: 'CNY',
        price_cny_note: '约 $2.75 / $8.25 per 1M tokens',
      },
      {
        id: 'qwen-turbo',
        name: 'Qwen Turbo',
        name_zh: '通义千问Turbo',
        description: 'Fast response, lower cost',
        description_zh: '快速响应，成本更低',
        context_window: 131072,
        input_price_per_1m: 0.3,
        output_price_per_1m: 0.9,
        currency: 'CNY',
        price_cny_note: '约 $0.04 / $0.12 per 1M tokens',
      },
      {
        id: 'qwen-long',
        name: 'Qwen Long',
        name_zh: '通义千问Long',
        description: 'Extra long context (1M tokens)',
        description_zh: '超长上下文（100万字）',
        context_window: 1048576,
        input_price_per_1m: 0.5,
        output_price_per_1m: 2.0,
        currency: 'CNY',
        price_cny_note: '约 $0.07 / $0.28 per 1M tokens',
      },
      {
        id: 'qwen-coder-plus',
        name: 'Qwen Coder Plus',
        name_zh: '通义coder Plus',
        description: 'Enhanced code generation model',
        description_zh: '增强版代码生成模型',
        context_window: 131072,
        input_price_per_1m: 1.2,
        output_price_per_1m: 3.6,
        currency: 'CNY',
        price_cny_note: '约 $0.17 / $0.50 per 1M tokens',
      },
    ],
    key_format: {
      pattern: '^sk-[a-f0-9]{32,}$',
      placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: 'sk-',
      example: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    auth_mode: 'api-key', // DashScope uses api_key param
    headers: {
      'Authorization': 'Bearer {API_KEY}',
      'Content-Type': 'application/json',
    },
  },

  'baidu-wenxin': {
    id: 'baidu-wenxin',
    name: 'Baidu Wenxin Yiyan',
    name_zh: '百度文心一言',
    icon: '🌐',
    color: '#2932e1',
    website: 'https://cloud.baidu.com/doc/wenxin.html',
    description: 'ERNIE Bot series by Baidu Cloud',
    description_zh: '百度文心一言 ERNIE Bot 系列模型',
    base_url: 'https://qianfan.baidubce.com/v2',
    docs_url: 'https://cloud.baidu.com/doc/wenxin.html',
    models: [
      {
        id: 'ernie-4.0-8k-latest',
        name: 'ERNIE 4.0 8K',
        name_zh: '文心一言4.0 8K',
        description: 'Latest most capable ERNIE model',
        description_zh: '最新最强ERNIE模型',
        context_window: 8192,
        input_price_per_1m: 120.0,
        output_price_per_1m: 120.0,
        currency: 'CNY',
        price_cny_note: '约 ¥120/¥120 per 1M tokens',
      },
      {
        id: 'ernie-4.0-8k',
        name: 'ERNIE 4.0 8K (Standard)',
        name_zh: '文心一言4.0 8K（标准版）',
        description: 'Standard ERNIE 4.0',
        description_zh: '标准版文心4.0',
        context_window: 8192,
        input_price_per_1m: 120.0,
        output_price_per_1m: 120.0,
        currency: 'CNY',
      },
      {
        id: 'ernie-3.5-8k',
        name: 'ERNIE 3.5 8K',
        name_zh: '文心一言3.5 8K',
        description: 'Cost-effective ERNIE 3.5',
        description_zh: '高性价比ERNIE 3.5',
        context_window: 8192,
        input_price_per_1m: 12.0,
        output_price_per_1m: 12.0,
        currency: 'CNY',
      },
      {
        id: 'ernie-speed-128k',
        name: 'ERNIE Speed 128K',
        name_zh: '文心一言极速版128K',
        description: 'Fast response, 128K context',
        description_zh: '快速响应，128K上下文',
        context_window: 131072,
        input_price_per_1m: 0.8,
        output_price_per_1m: 2.0,
        currency: 'CNY',
      },
      {
        id: 'ernie-lite-8k',
        name: 'ERNIE Lite 8K',
        name_zh: '文心一言Lite 8K',
        description: 'Lightweight, affordable',
        description_zh: '轻量版，经济实惠',
        context_window: 8192,
        input_price_per_1m: 0.8,
        output_price_per_1m: 2.4,
        currency: 'CNY',
      },
    ],
    key_format: {
      pattern: '^[A-Za-z0-9_-]{32,}$',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: '',
      example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    auth_mode: 'bce', // Baidu uses BCE authentication
    auth_note: '需要使用百度云 Access Key / Secret Key 生成 JWT Token',
  },

  'iflytek-xunfei': {
    id: 'iflytek-xunfei',
    name: 'iFlytek Spark',
    name_zh: '讯飞星火',
    icon: '✨',
    color: '#00a6f0',
    website: 'https://xinghuo.xfyun.cn',
    description: 'Spark series by iFlytek (Xunfei)',
    description_zh: '讯飞星火认知大模型系列',
    base_url: 'https://spark-api.xf-yun.com/v3.5/chat',
    docs_url: 'https://www.xfyun.cn/doc/spark/',
    models: [
      {
        id: 'spark-4.0',
        name: 'Spark 4.0 Ultra',
        name_zh: '星火4.0 Ultra',
        description: 'Latest most capable Spark model',
        description_zh: '最新最强星火模型',
        context_window: 128000,
        input_price_per_1m: 120.0,
        output_price_per_1m: 120.0,
        currency: 'CNY',
        price_cny_note: '约 ¥120 per 1M tokens',
      },
      {
        id: 'spark-3.5',
        name: 'Spark 3.5 Pro',
        name_zh: '星火3.5 Pro',
        description: 'Professional Spark model',
        description_zh: '专业版星火模型',
        context_window: 128000,
        input_price_per_1m: 60.0,
        output_price_per_1m: 60.0,
        currency: 'CNY',
      },
      {
        id: 'spark-3.5-ultra',
        name: 'Spark 3.5 Ultra',
        name_zh: '星火3.5 Ultra',
        description: 'Enhanced Spark 3.5',
        description_zh: '增强版星火3.5',
        context_window: 128000,
        input_price_per_1m: 60.0,
        output_price_per_1m: 60.0,
        currency: 'CNY',
      },
      {
        id: 'spark-3.5-standard',
        name: 'Spark 3.5 Standard',
        name_zh: '星火3.5 标准版',
        description: 'Standard Spark 3.5',
        description_zh: '星火3.5标准版',
        context_window: 128000,
        input_price_per_1m: 30.0,
        output_price_per_1m: 30.0,
        currency: 'CNY',
      },
      {
        id: 'spark-2.0',
        name: 'Spark 2.0',
        name_zh: '星火2.0',
        description: 'Earlier Spark model',
        description_zh: '早期星火模型',
        context_window: 32000,
        input_price_per_1m: 12.0,
        output_price_per_1m: 12.0,
        currency: 'CNY',
      },
    ],
    key_format: {
      pattern: '^[A-Fa-f0-9]{32}$',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: '',
      example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    auth_mode: 'xf-api', // iFlytek uses app_id + api_secret + api_key
    auth_note: '讯飞使用 app_id + api_secret + api_key 三要素认证',
    additional_auth: {
      app_id: { type: 'string', label: 'App ID', placeholder: 'xxxxxxxx' },
      api_secret: { type: 'string', label: 'API Secret', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    },
  },

  'tencent-hunyuan': {
    id: 'tencent-hunyuan',
    name: 'Tencent Hunyuan',
    name_zh: '腾讯混元',
    icon: '🐧',
    color: '#12b7f5',
    website: 'https://cloud.tencent.com/document/product/1729',
    description: 'Hunyuan series by Tencent Cloud',
    description_zh: '腾讯云混元大模型系列',
    base_url: 'https://hunyuan.cloud.tencent.com/v2',
    docs_url: 'https://cloud.tencent.com/document/product/1729',
    models: [
      {
        id: 'hunyuan-pro',
        name: 'Hunyuan Pro',
        name_zh: '混元Pro',
        description: 'Most capable Hunyuan model',
        description_zh: '最强混元模型',
        context_window: 128000,
        input_price_per_1m: 90.0,
        output_price_per_1m: 90.0,
        currency: 'CNY',
        price_cny_note: '约 ¥90 per 1M tokens',
      },
      {
        id: 'hunyuan-standard',
        name: 'Hunyuan Standard',
        name_zh: '混元标准版',
        description: 'Standard Hunyuan model',
        description_zh: '混元标准版',
        context_window: 128000,
        input_price_per_1m: 30.0,
        output_price_per_1m: 60.0,
        currency: 'CNY',
      },
      {
        id: 'hunyuan-standard-256k',
        name: 'Hunyuan Standard 256K',
        name_zh: '混元标准版256K',
        description: 'Standard with 256K context',
        description_zh: '标准版256K上下文',
        context_window: 262144,
        input_price_per_1m: 60.0,
        output_price_per_1m: 120.0,
        currency: 'CNY',
      },
      {
        id: 'hunyuan-lite',
        name: 'Hunyuan Lite',
        name_zh: '混元Lite',
        description: 'Lightweight, affordable',
        description_zh: '轻量版，经济实惠',
        context_window: 32000,
        input_price_per_1m: 5.0,
        output_price_per_1m: 5.0,
        currency: 'CNY',
      },
      {
        id: 'hunyuan-code',
        name: 'Hunyuan Code',
        name_zh: '混元代码',
        description: 'Code-specialized model',
        description_zh: '代码专用模型',
        context_window: 128000,
        input_price_per_1m: 30.0,
        output_price_per_1m: 60.0,
        currency: 'CNY',
      },
    ],
    key_format: {
      pattern: '^[A-Za-z0-9_-]{50,}$',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: '',
      example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    auth_mode: 'tencent-cvm', // Tencent uses SecretId/SecretKey
    auth_note: '腾讯使用 SecretId + SecretKey 认证（需在腾讯云控制台生成）',
    additional_auth: {
      secret_id: { type: 'string', label: 'Secret ID', placeholder: 'AKIDxxxxxxxxxxxxxxxx' },
      secret_key: { type: 'string', label: 'Secret Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx' },
    },
  },

  'zhipu': {
    id: 'zhipu',
    name: 'Zhipu AI (GLM)',
    name_zh: '智谱AI',
    icon: '💎',
    color: '#7c3aed',
    website: 'https://open.bigmodel.cn',
    description: 'GLM series by Zhipu AI (Beijing Zhipu)',
    description_zh: '智谱AI GLM大模型系列（北京智谱华章）',
    base_url: 'https://open.bigmodel.cn/api/paas/v4',
    docs_url: 'https://open.bigmodel.cn/dev/api',
    models: [
      {
        id: 'glm-4-plus',
        name: 'GLM-4 Plus',
        name_zh: '智谱GLM-4 Plus',
        description: 'Most capable GLM-4 model',
        description_zh: '最强GLM-4模型',
        context_window: 128000,
        input_price_per_1m: 100.0,
        output_price_per_1m: 100.0,
        currency: 'CNY',
        price_cny_note: '约 ¥100 per 1M tokens',
      },
      {
        id: 'glm-4',
        name: 'GLM-4',
        name_zh: '智谱GLM-4',
        description: 'Standard GLM-4 model',
        description_zh: '标准版GLM-4',
        context_window: 128000,
        input_price_per_1m: 100.0,
        output_price_per_1m: 100.0,
        currency: 'CNY',
      },
      {
        id: 'glm-4-flash',
        name: 'GLM-4 Flash',
        name_zh: '智谱GLM-4 Flash',
        description: 'Fast, cost-effective GLM-4',
        description_zh: '快速、经济版GLM-4',
        context_window: 128000,
        input_price_per_1m: 1.0,
        output_price_per_1m: 1.0,
        currency: 'CNY',
      },
      {
        id: 'glm-3-turbo',
        name: 'GLM-3 Turbo',
        name_zh: '智谱GLM-3 Turbo',
        description: 'Previous generation, good value',
        description_zh: '上一代，高性价比',
        context_window: 128000,
        input_price_per_1m: 1.0,
        output_price_per_1m: 1.0,
        currency: 'CNY',
      },
      {
        id: 'glm-4v-plus',
        name: 'GLM-4V Plus',
        name_zh: '智谱GLM-4V Plus',
        description: 'Vision multimodal model',
        description_zh: '视觉多模态模型',
        context_window: 4096,
        input_price_per_1m: 100.0,
        output_price_per_1m: 100.0,
        currency: 'CNY',
      },
      {
        id: 'cogview-3-plus',
        name: 'CogView-3 Plus',
        name_zh: '智谱CogView-3',
        description: 'Image generation model',
        description_zh: '图像生成模型',
        context_window: 1024,
        input_price_per_1m: 50.0,
        output_price_per_1m: 50.0,
        currency: 'CNY',
        unit: '张',
        unit_note: '生成一张图片',
      },
    ],
    key_format: {
      pattern: '^[A-Za-z0-9_-]{24,}$',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: '',
      example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    headers: {
      'Authorization': 'Bearer {API_KEY}',
      'Content-Type': 'application/json',
    },
  },

  'minimax': {
    id: 'minimax',
    name: 'MiniMax',
    name_zh: '稀宇科技',
    icon: '🌊',
    color: '#00d4aa',
    website: 'https://www.minimax.io',
    description: 'MiniMax MoE models by MiniMax',
    description_zh: '稀宇科技 MiniMax MoE 大模型',
    base_url: 'https://api.minimax.chat/v',
    docs_url: 'https://www.minimaxi.com/document',
    models: [
      {
        id: 'MiniMax-Text-01',
        name: 'MiniMax Text 01',
        name_zh: 'MiniMax Text 01',
        description: 'Most capable text model, 1M context',
        description_zh: '最强文本模型，100万字上下文',
        context_window: 1048576,
        input_price_per_1m: 11.0,
        output_price_per_1m: 110.0,
        currency: 'CNY',
        price_cny_note: '约 ¥11/¥110 per 1M tokens',
      },
      {
        id: 'abab6.5s-chat',
        name: 'ABAB 6.5S Chat',
        name_zh: 'ABAB 6.5S 对话',
        description: 'Fast conversational model',
        description_zh: '快速对话模型',
        context_window: 245760,
        input_price_per_1m: 1.0,
        output_price_per_1m: 1.0,
        currency: 'CNY',
      },
      {
        id: 'abab6.5-chat',
        name: 'ABAB 6.5 Chat',
        name_zh: 'ABAB 6.5 对话',
        description: 'Standard conversational model',
        description_zh: '标准对话模型',
        context_window: 245760,
        input_price_per_1m: 10.0,
        output_price_per_1m: 10.0,
        currency: 'CNY',
      },
      {
        id: 'abab5.5-chat',
        name: 'ABAB 5.5 Chat',
        name_zh: 'ABAB 5.5 对话',
        description: 'Previous generation model',
        description_zh: '上一代对话模型',
        context_window: 163840,
        input_price_per_1m: 10.0,
        output_price_per_1m: 10.0,
        currency: 'CNY',
      },
      {
        id: 'speech-02-hd',
        name: 'Speech-02-HD',
        name_zh: '语音合成 HD',
        description: 'High definition voice synthesis',
        description_zh: '高清语音合成',
        context_window: 10000,
        input_price_per_1m: 100.0,
        output_price_per_1m: 0,
        currency: 'CNY',
        unit: '千字符',
        unit_note: '按输入字符数计费',
      },
      {
        id: 'video-01',
        name: 'Video-01',
        name_zh: '视频生成',
        description: 'Video generation model',
        description_zh: '视频生成模型',
        context_window: 1,
        input_price_per_1m: 5000.0,
        output_price_per_1m: 0,
        currency: 'CNY',
        unit: '秒',
        unit_note: '按生成秒数计费',
      },
    ],
    key_format: {
      pattern: '^[A-Za-z0-9]{32,}$',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      prefix: '',
      example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    headers: {
      'Authorization': 'Bearer {API_KEY}',
      'Content-Type': 'application/json',
    },
    additional_auth: {
      group_id: { type: 'string', label: 'Group ID', placeholder: '1234567890' },
    },
  },
};

/**
 * Get a provider by its ID
 * @param {string} id - Provider ID
 * @returns {Object|null} Provider config or null
 */
export function getProviderById(id) {
  return API_PROVIDERS[id] || null;
}

/**
 * Get all providers as an array (for UI listing)
 * @returns {Array} List of provider summaries
 */
export function listProviders() {
  return Object.values(API_PROVIDERS).map(p => ({
    id: p.id,
    name: p.name,
    name_zh: p.name_zh,
    icon: p.icon,
    color: p.color,
    description: p.description,
    description_zh: p.description_zh,
    model_count: p.models.length,
    models: p.models.map(m => ({
      id: m.id,
      name: m.name,
      name_zh: m.name_zh,
      description: m.description,
      context_window: m.context_window,
    })),
  }));
}

/**
 * Get all models across all providers (flat list)
 * @returns {Array} All models with provider info
 */
export function listAllModels() {
  const models = [];
  for (const provider of Object.values(API_PROVIDERS)) {
    for (const model of provider.models) {
      models.push({
        ...model,
        provider_id: provider.id,
        provider_name: provider.name,
        provider_name_zh: provider.name_zh,
        provider_icon: provider.icon,
      });
    }
  }
  return models;
}

/**
 * Validate API key format for a provider
 * @param {string} providerId - Provider ID
 * @param {string} apiKey - API key to validate
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateApiKeyFormat(providerId, apiKey) {
  const provider = API_PROVIDERS[providerId];
  if (!provider) {
    return { valid: false, message: `Unknown provider: ${providerId}` };
  }

  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, message: 'API key is required' };
  }

  const { pattern } = provider.key_format;
  const regex = new RegExp(pattern);
  if (!regex.test(apiKey)) {
    return {
      valid: false,
      message: `Invalid API key format for ${provider.name}. Expected: ${provider.key_format.placeholder}`,
    };
  }

  return { valid: true };
}

/**
 * Get default model for a provider
 * @param {string} providerId - Provider ID
 * @returns {string} Default model ID
 */
export function getDefaultModel(providerId) {
  const provider = API_PROVIDERS[providerId];
  if (!provider || provider.models.length === 0) return null;
  return provider.models[0].id;
}

/**
 * Get provider groups for categorized display
 * @returns {{ international: Array, domestic: Array }}
 */
export function getProviderGroups() {
  const international = ['openai', 'anthropic'];
  const domestic = ['deepseek', 'aliyun-qwen', 'baidu-wenxin', 'iflytek-xunfei', 'tencent-hunyuan'];

  const map = (ids) =>
    ids
      .map(id => API_PROVIDERS[id])
      .filter(Boolean)
      .map(p => ({
        id: p.id,
        name: p.name,
        name_zh: p.name_zh,
        icon: p.icon,
        color: p.color,
        description: p.description,
        description_zh: p.description_zh,
        model_count: p.models.length,
      }));

  return {
    international: map(international),
    domestic: map(domestic),
  };
}

export default API_PROVIDERS;
