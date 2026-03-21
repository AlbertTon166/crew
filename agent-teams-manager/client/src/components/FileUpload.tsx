/**
 * File Upload Component - For requirement document upload
 * Max file size: 500KB
 */

import { useState, useRef } from 'react'

interface FileUploadProps {
  onUpload: (file: File, content: string) => void
  disabled?: boolean
  language?: 'zh' | 'en'
}

const MAX_FILE_SIZE = 500 * 1024 // 500KB

const ACCEPTED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
]

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.json', '.html', '.csv', '.docx']

export default function FileUpload({ onUpload, disabled = false, language = 'zh' }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(language === 'zh' 
          ? `文件过大！最大支持 ${MAX_FILE_SIZE / 1024}KB，当前文件 ${(file.size / 1024).toFixed(1)}KB`
          : `File too large! Max ${MAX_FILE_SIZE / 1024}KB, current file ${(file.size / 1024).toFixed(1)}KB`)
      }

      // Check file type
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
        throw new Error(language === 'zh'
          ? `不支持的文件类型。支持: ${ACCEPTED_EXTENSIONS.join(', ')}`
          : `Unsupported file type. Supported: ${ACCEPTED_EXTENSIONS.join(', ')}`)
      }

      // Read file content
      const content = await readFileContent(file)
      
      // Truncate if too long
      let finalContent = content
      if (content.length > 50000) {
        finalContent = content.substring(0, 50000) + '\n\n[内容过长，已截断...]'
        setError(language === 'zh'
          ? '⚠️ 文件内容过长，已自动截断以避免超出上下文限制'
          : '⚠️ File content too long, truncated to avoid context overflow')
      }

      onUpload(file, finalContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'zh' ? '上传失败' : 'Upload failed'))
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(language === 'zh' ? '读取文件失败' : 'Failed to read file'))
      reader.readAsText(file)
    })
  }

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
        id="requirement-file-upload"
      />
      
      <label
        htmlFor="requirement-file-upload"
        className={`upload-button ${disabled || uploading ? 'disabled' : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px dashed var(--border-primary)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s ease',
        }}
      >
        {uploading ? (
          <>
            <span className="spinner" style={{ width: '16px', height: '16px' }} />
            {language === 'zh' ? '上传中...' : 'Uploading...'}
          </>
        ) : (
          <>
            <span>📎</span>
            {language === 'zh' ? '上传需求文档' : 'Upload Requirement Doc'}
          </>
        )}
      </label>

      {error && (
        <p style={{
          color: '#F87171',
          fontSize: '12px',
          marginTop: '8px',
        }}>
        {error}
      </p>
      )}

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '11px',
        marginTop: '8px',
      }}>
        {language === 'zh' 
          ? `支持格式: ${ACCEPTED_EXTENSIONS.join(', ')}，最大 ${MAX_FILE_SIZE / 1024}KB`
          : `Supported: ${ACCEPTED_EXTENSIONS.join(', ')}, max ${MAX_FILE_SIZE / 1024}KB`}
      </p>
    </div>
  )
}
