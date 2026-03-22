/**
 * Feishu (Lark) Notification Integration
 * 
 * Sends notifications to Feishu channels via webhook or API.
 */

// Feishu webhook configuration
const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL
const FEISHU_BOT_NAME = process.env.FEISHU_BOT_NAME || 'Agent Teams Bot'

/**
 * Send a message to Feishu via webhook
 * @param {string} message - Message content
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>}
 */
export async function sendFeishuNotification(message, options = {}) {
  if (!FEISHU_WEBHOOK_URL) {
    console.warn('FEISHU_WEBHOOK_URL not configured, skipping notification')
    return false
  }

  try {
    const payload = {
      msg_type: 'text',
      content: {
        text: message
      }
    }

    const response = await fetch(FEISHU_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    return response.ok
  } catch (error) {
    console.error('Failed to send Feishu notification:', error.message)
    return false
  }
}

/**
 * Send a rich message card to Feishu
 * @param {string} title - Card title
 * @param {string} content - Card content (markdown supported)
 * @param {Array} actions - Action buttons
 * @returns {Promise<boolean>}
 */
export async function sendFeishuCard(title, content, actions = []) {
  if (!FEISHU_WEBHOOK_URL) {
    console.warn('FEISHU_WEBHOOK_URL not configured, skipping notification')
    return false
  }

  try {
    const card = {
      msg_type: 'interactive',
      card: {
        header: {
          title: {
            tag: 'plain_text',
            content: title
          },
          template: 'blue'
        },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: content
            }
          },
          ...actions.map(action => ({
            tag: 'action',
            actions: [{
              tag: 'click',
              text: { tag: 'plain_text', content: action.label },
              type: 'primary'
            }]
          }))
        ]
      }
    }

    const response = await fetch(FEISHU_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(card)
    })

    return response.ok
  } catch (error) {
    console.error('Failed to send Feishu card:', error.message)
    return false
  }
}

/**
 * Notify project status change
 */
export async function notifyProjectStatusChange(project, oldStatus, newStatus) {
  const statusLabels = {
    'pending': '待处理',
    'evaluating': '评估中',
    'pending_dev': '待开发',
    'in_progress': '开发中',
    'testing': '测试中',
    'completed': '已完成',
    'error': '错误'
  }

  const message = `📋 项目状态更新

项目: ${project.name}
状态变更: ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}
时间: ${new Date().toLocaleString('zh-CN')}

${project.description || ''}`

  return sendFeishuNotification(message)
}

/**
 * Notify task assignment
 */
export async function notifyTaskAssignment(task, agent) {
  const priorityLabels = { high: '🔴 高', medium: '🟡 中', low: '🟢 低' }
  
  const message = `📌 新任务分配

任务: ${task.title || task.title_zh || '未命名任务'}
描述: ${task.description || '无'}
优先级: ${priorityLabels[task.priority] || '🟡 中'}
预估工时: ${task.estimated_hours || 0}h
分配给: ${agent?.name || '未知Agent'}
项目ID: ${task.project_id}`

  return sendFeishuNotification(message)
}

/**
 * Notify task completion
 */
export async function notifyTaskCompletion(task, output) {
  const message = `✅ 任务完成

任务: ${task.title || task.title_zh || '未命名任务'}
完成时间: ${new Date().toLocaleString('zh-CN')}
结果: ${output || '成功'}`

  return sendFeishuNotification(message)
}

/**
 * Notify agent execution result
 */
export async function notifyAgentExecution(task, session, status) {
  const statusEmoji = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⏳'
  
  const message = `${statusEmoji} Agent执行报告

任务: ${task.title || task.title_zh || '未命名任务'}
会话ID: ${session?.id || 'N/A'}
状态: ${status}
时间: ${new Date().toLocaleString('zh-CN')}`

  return sendFeishuNotification(message)
}

export default {
  sendFeishuNotification,
  sendFeishuCard,
  notifyProjectStatusChange,
  notifyTaskAssignment,
  notifyTaskCompletion,
  notifyAgentExecution
}
