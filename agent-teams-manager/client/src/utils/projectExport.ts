/**
 * Project Export Helper - Download project data as JSON
 */

import { projectExportApi } from '../api'

export async function exportProject(projectId: string, projectName: string) {
  try {
    const data = await projectExportApi.export(projectId)
    
    // Convert to JSON string
    const jsonStr = JSON.stringify(data, null, 2)
    
    // Create blob and download
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}_export_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return { success: true }
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  }
}
