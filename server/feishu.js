/**
 * Feishu Notification Service
 * 飞书消息通知服务
 */

const FEISHU_API = 'https://open.feishu.cn/open-apis'

interface FeishuMessage {
  recipient_type: 'open_id' | 'user_id' | 'union_id' | 'email' | 'chat_id'
  recipient_id: string
  msg_type: 'text' | 'post' | 'interactive'
  content: {
    text?: string
    post?: any
    card?: any
  }
}

/**
 * 发送飞书消息
 */
export async function sendFeishuMessage(config: {
  appId: string
  appSecret: string
  recipientType: 'open_id' | 'user_id' | 'chat_id'
  recipientId: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 获取 tenant access token
    const tokenResponse = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.appId,
        app_secret: config.appSecret,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    if (tokenData.code !== 0) {
      return { success: false, error: `Failed to get token: ${tokenData.msg}` }
    }
    
    const accessToken = tokenData.tenant_access_token
    
    // 发送消息
    const messagePayload: FeishuMessage = {
      recipient_type: config.recipientType,
      recipient_id: config.recipientId,
      msg_type: 'text',
      content: {
        text: config.message,
      },
    }
    
    // 支持 chat_id (群发)
    const endpoint = config.recipientType === 'chat_id' 
      ? `${FEISHU_API}/im/v1/messages?receive_id_type=chat_id`
      : `${FEISHU_API}/im/v1/messages?receive_id_type=${config.recipientType}`
    
    const messageResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    })
    
    const result = await messageResponse.json()
    
    if (result.code === 0 || result.status_code === 0) {
      return { success: true }
    }
    
    return { success: false, error: result.msg || 'Failed to send message' }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 构建富文本消息卡片
 */
export function buildNotificationCard(data: {
  title: string
  content: string[]
  status: 'success' | 'warning' | 'error' | 'info'
  actions?: { text: string; url: string }[]
}): any {
  const statusEmoji = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
  }
  
  return {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: `${statusEmoji[data.status]} ${data.title}`,
        },
        template: data.status === 'error' ? 'red' : data.status === 'warning' ? 'orange' : 'blue',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: data.content.join('\n'),
          },
        },
        ...(data.actions ? [{
          tag: 'action',
          actions: data.actions.map(action => ({
            tag: 'a',
            text: { tag: 'plain_text', content: action.text },
            url: action.url,
          })),
        }] : []),
      ],
    },
  }
}

/**
 * 发送任务完成通知
 */
export async function sendTaskCompletedNotification(config: {
  appId: string
  appSecret: string
  recipientId: string
  taskTitle: string
  projectName: string
  agentName: string
  output?: string
}): Promise<{ success: boolean; error?: string }> {
  const card = buildNotificationCard({
    title: '任务完成通知',
    status: 'success',
    content: [
      `**项目:** ${config.projectName}`,
      `**任务:** ${config.taskTitle}`,
      `**执行Agent:** ${config.agentName}`,
      config.output ? `**输出:** ${config.output.substring(0, 100)}${config.output.length > 100 ? '...' : ''}` : '',
    ],
  })
  
  try {
    // 获取 token
    const tokenResponse = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.appId,
        app_secret: config.appSecret,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    if (tokenData.code !== 0) {
      return { success: false, error: tokenData.msg }
    }
    
    // 发送卡片消息
    const response = await fetch(`${FEISHU_API}/im/v1/messages?receive_id_type=open_id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.tenant_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: config.recipientId,
        msg_type: 'interactive',
        content: JSON.stringify(card.card),
      }),
    })
    
    const result = await response.json()
    return result.code === 0 
      ? { success: true }
      : { success: false, error: result.msg }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 发送任务失败通知
 */
export async function sendTaskFailedNotification(config: {
  appId: string
  appSecret: string
  recipientId: string
  taskTitle: string
  projectName: string
  error: string
}): Promise<{ success: boolean; error?: string }> {
  const card = buildNotificationCard({
    title: '任务失败警告',
    status: 'error',
    content: [
      `**项目:** ${config.projectName}`,
      `**任务:** ${config.taskTitle}`,
      `**错误:** ${config.error}`,
    ],
  })
  
  try {
    const tokenResponse = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.appId,
        app_secret: config.appSecret,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    if (tokenData.code !== 0) {
      return { success: false, error: tokenData.msg }
    }
    
    const response = await fetch(`${FEISHU_API}/im/v1/messages?receive_id_type=open_id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.tenant_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: config.recipientId,
        msg_type: 'interactive',
        content: JSON.stringify(card.card),
      }),
    })
    
    const result = await response.json()
    return result.code === 0 
      ? { success: true }
      : { success: false, error: result.msg }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 发送需求确认通知
 */
export async function sendRequirementConfirmedNotification(config: {
  appId: string
  appSecret: string
  recipientId: string
  requirement: string
  projectName: string
  taskId: string
}): Promise<{ success: boolean; error?: string }> {
  const card = buildNotificationCard({
    title: '需求已确认',
    status: 'success',
    content: [
      `**项目:** ${config.projectName}`,
      `**需求:** ${config.requirement.substring(0, 50)}${config.requirement.length > 50 ? '...' : ''}`,
      `✅ 开发任务已自动创建`,
    ],
    actions: [
      { text: '查看任务', url: `/projects?task=${config.taskId}` },
    ],
  })
  
  try {
    const tokenResponse = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.appId,
        app_secret: config.appSecret,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    if (tokenData.code !== 0) {
      return { success: false, error: tokenData.msg }
    }
    
    const response = await fetch(`${FEISHU_API}/im/v1/messages?receive_id_type=open_id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.tenant_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: config.recipientId,
        msg_type: 'interactive',
        content: JSON.stringify(card.card),
      }),
    })
    
    const result = await response.json()
    return result.code === 0 
      ? { success: true }
      : { success: false, error: result.msg }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
