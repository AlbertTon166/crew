import { useState } from 'react'
import { 
  Search, Plus, Settings, Trash2, X, 
  ExternalLink, Check, Link2
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface APIDocItem {
  id: string
  name: string
  nameZh: string
  url: string
  category: string
  categoryZh: string
}

// Mock API documentation connections
const mockAPIDocs: APIDocItem[] = [
  { id: '1', name: 'Feishu', nameZh: '飞书', url: 'https://open.feishu.cn/document/server-docs', category: 'Communication', categoryZh: '通讯' },
  { id: '2', name: 'Amazon AWS', nameZh: '亚马逊云', url: 'https://docs.aws.amazon.com/', category: 'Cloud', categoryZh: '云服务' },
  { id: '3', name: 'Taobao Open', nameZh: '淘宝开放平台', url: 'https://open.taobao.com/', category: 'E-commerce', categoryZh: '电商' },
  { id: '4', name: 'DingTalk', nameZh: '钉钉', url: 'https://developers.dingtalk.com/', category: 'Communication', categoryZh: '通讯' },
  { id: '5', name: 'Salesforce', nameZh: 'Salesforce CRM', url: 'https://developer.salesforce.com/docs', category: 'CRM', categoryZh: '客户管理' },
  { id: '6', name: 'SAP ERP', nameZh: 'SAP ERP', url: 'https://help.sap.com/', category: 'ERP', categoryZh: '企业资源' },
]

const categories = [
  { id: 'all', label: '全部', labelEn: 'All' },
  { id: 'Communication', label: '通讯', labelEn: 'Communication' },
  { id: 'Cloud', label: '云服务', labelEn: 'Cloud' },
  { id: 'E-commerce', label: '电商', labelEn: 'E-commerce' },
  { id: 'CRM', label: '客户管理', labelEn: 'CRM' },
  { id: 'ERP', label: '企业资源', labelEn: 'ERP' },
]

export default function APIDoc() {
  const { language } = useLanguage()
  const [apiDocs, setAPIDocs] = useState<APIDocItem[]>(mockAPIDocs)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingUrl, setEditingUrl] = useState('')
  const [newAPIDoc, setNewAPIDoc] = useState({ name: '', url: '' })

  const filteredDocs = apiDocs.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.nameZh.includes(search) ||
      doc.url.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.id === category)
    return language === 'zh' ? (cat?.label || category) : (cat?.labelEn || category)
  }

  const getDocName = (doc: APIDocItem) => language === 'zh' ? doc.nameZh : doc.name

  const handleDelete = (id: string) => {
    setAPIDocs(apiDocs.filter(doc => doc.id !== id))
  }

  const handleEdit = (doc: APIDocItem) => {
    setEditingId(doc.id)
    setEditingUrl(doc.url)
  }

  const handleSaveEdit = (id: string) => {
    setAPIDocs(apiDocs.map(doc => 
      doc.id === id ? { ...doc, url: editingUrl } : doc
    ))
    setEditingId(null)
    setEditingUrl('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingUrl('')
  }

  const handleAdd = () => {
    if (newAPIDoc.name.trim() && newAPIDoc.url.trim()) {
      const newDoc: APIDocItem = {
        id: Date.now().toString(),
        name: newAPIDoc.name,
        nameZh: newAPIDoc.name,
        url: newAPIDoc.url,
        category: 'E-commerce',
        categoryZh: '电商',
      }
      setAPIDocs([...apiDocs, newDoc])
      setNewAPIDoc({ name: '', url: '' })
      setShowAddModal(false)
    }
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', marginTop: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {language === 'zh' ? 'API文档' : 'API Documents'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '管理外部API接口文档连接' : 'Manage external API documentation links'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 16px var(--primary-glow)'
          }}
        >
          <Plus size={18} />
          {language === 'zh' ? '添加API文档' : 'Add API Doc'}
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
          <input
            type="text"
            placeholder={language === 'zh' ? '搜索API文档...' : 'Search API docs...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 46px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                padding: '10px 16px',
                background: categoryFilter === cat.id ? 'var(--primary)' : 'var(--bg-card)',
                border: categoryFilter === cat.id ? 'none' : '1px solid var(--border)',
                borderRadius: '10px',
                color: categoryFilter === cat.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {language === 'zh' ? cat.label : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* API Doc Cards Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {filteredDocs.map(doc => (
          <div
            key={doc.id}
            style={{
              width: '280px',
              padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            {/* Top Right Icons */}
            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleEdit(doc)}
                style={{
                  padding: '6px',
                  background: editingId === doc.id ? 'var(--primary)' : 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Settings size={14} style={{ color: editingId === doc.id ? '#fff' : 'var(--text-tertiary)' }} />
              </button>
              <button
                onClick={() => handleDelete(doc.id)}
                style={{
                  padding: '6px',
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={14} style={{ color: '#F87171' }} />
              </button>
            </div>

            {/* Category Tag */}
            <div style={{
              display: 'inline-block',
              padding: '3px 8px',
              background: 'var(--bg-tertiary)',
              borderRadius: '6px',
              fontSize: '10px',
              color: 'var(--text-tertiary)',
              marginBottom: '10px'
            }}>
              {getCategoryLabel(doc.category)}
            </div>

            {/* Name */}
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '10px',
              paddingRight: '60px'
            }}>
              {getDocName(doc)}
            </h3>

            {/* API Connection Link */}
            {editingId === doc.id ? (
              <div>
                <a
                  href={editingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#60A5FA',
                    textDecoration: 'none',
                    marginBottom: '10px'
                  }}
                >
                  <Link2 size={12} />
                  {language === 'zh' ? 'API连接' : 'API Link'}
                  <ExternalLink size={10} />
                </a>
                <input
                  type="text"
                  value={editingUrl}
                  onChange={(e) => setEditingUrl(e.target.value)}
                  placeholder={language === 'zh' ? '输入API地址...' : 'Enter API URL...'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--primary)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace'
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleSaveEdit(doc.id)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={12} />
                    {language === 'zh' ? '保存' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: 'var(--bg-tertiary)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#60A5FA',
                  textDecoration: 'none',
                  padding: '6px 10px',
                  background: 'rgba(96, 165, 250, 0.1)',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Link2 size={12} />
                {language === 'zh' ? 'API连接' : 'API Link'}
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-tertiary)'
        }}>
          <Link2 size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '15px' }}>
            {language === 'zh' ? '未找到API文档' : 'No API documents found'}
          </p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {language === 'zh' ? '添加API文档' : 'Add API Document'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '6px',
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <X size={16} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>
                  {language === 'zh' ? '名称' : 'Name'}
                </label>
                <input
                  type="text"
                  value={newAPIDoc.name}
                  onChange={(e) => setNewAPIDoc({ ...newAPIDoc, name: e.target.value })}
                  placeholder={language === 'zh' ? '例如：飞书、SAP、淘宝' : 'e.g. Feishu, SAP, Taobao'}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase'
                }}>
                  {language === 'zh' ? '地址' : 'URL'}
                </label>
                <input
                  type="text"
                  value={newAPIDoc.url}
                  onChange={(e) => setNewAPIDoc({ ...newAPIDoc, url: e.target.value })}
                  placeholder={language === 'zh' ? '例如：https://api.example.com' : 'e.g. https://api.example.com'}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newAPIDoc.name.trim() || !newAPIDoc.url.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: newAPIDoc.name.trim() && newAPIDoc.url.trim() 
                      ? 'linear-gradient(135deg, var(--primary), var(--accent-violet))' 
                      : 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: '10px',
                    color: newAPIDoc.name.trim() && newAPIDoc.url.trim() ? '#fff' : 'var(--text-tertiary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: newAPIDoc.name.trim() && newAPIDoc.url.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  {language === 'zh' ? '添加' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
