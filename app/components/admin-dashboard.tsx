

"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { 
  Users, 
  Settings, 
  UserPlus, 
  Database,
  Activity,
  Shield,
  Calendar,
  FileText,
  Play,
  Vote,
  CheckCircle,
  Clock,
  Gavel,
  MessageSquare,
  Mic,
  ArrowRight,
  Plus,
  Monitor,
  StopCircle,
  Eye,
  Timer,
  BookOpen,
  User,
  Trash2,
  Edit
} from "lucide-react"

// Componente para gerenciar Considerações Finais
function ConsideracoesFinaisTab() {
  const [speechRequests, setSpeechRequests] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [speechSubject, setSpeechSubject] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar solicitações de fala
      const speechResponse = await fetch('/api/speech-request')
      if (speechResponse.ok) {
        const speechData = await speechResponse.json()
        setSpeechRequests(speechData)
      }

      // Buscar lista de vereadores
      const usersResponse = await fetch('/api/users?role=COUNCILOR')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleApproveSpeech = async (speechId: string, isApproved: boolean) => {
    try {
      const response = await fetch(`/api/speech-request/${speechId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved })
      })
      
      if (response.ok) {
        toast.success(isApproved ? 'Solicitação aprovada!' : 'Solicitação rejeitada!')
        fetchData()
      }
    } catch (error) {
      toast.error('Erro ao processar solicitação')
    }
  }

  const handleSetSpeaking = async (speechId: string, isSpeaking: boolean) => {
    try {
      const response = await fetch(`/api/speech-request/${speechId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpeaking })
      })
      
      if (response.ok) {
        toast.success(isSpeaking ? 'Vereador marcado como falando' : 'Vereador não está mais falando')
        fetchData()
      }
    } catch (error) {
      toast.error('Erro ao marcar como falando')
    }
  }

  const handleAddSpeechRequest = async () => {
    if (!selectedUser || !speechSubject) return
    
    try {
      const response = await fetch('/api/speech-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUser,
          subject: speechSubject,
          type: 'CONSIDERACOES_FINAIS'
        })
      })
      
      if (response.ok) {
        toast.success('Vereador cadastrado nas considerações finais!')
        setSelectedUser('')
        setSpeechSubject('')
        setIsDialogOpen(false)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao cadastrar vereador')
      }
    } catch (error) {
      toast.error('Erro ao cadastrar vereador')
    }
  }

  const handleDeleteSpeechRequest = async (speechId: string) => {
    if (!confirm('Tem certeza que deseja remover esta solicitação?')) return
    
    try {
      const response = await fetch(`/api/speech-request/${speechId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Solicitação removida!')
        fetchData()
      }
    } catch (error) {
      toast.error('Erro ao remover solicitação')
    }
  }

  return (
    <div className="space-y-6">
      {/* Botão para cadastrar vereador */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gerenciar Solicitações de Fala</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-1" />
              Cadastrar Vereador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Vereador nas Considerações Finais</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Selecionar Vereador</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vereador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Assunto da Fala</label>
                <Input
                  value={speechSubject}
                  onChange={(e) => setSpeechSubject(e.target.value)}
                  placeholder="Ex: Questões sobre obras públicas"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddSpeechRequest}>Cadastrar</Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de solicitações */}
      <div className="space-y-4">
        {speechRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma solicitação de fala ainda</p>
        ) : (
          speechRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{request.subject}</h4>
                <p className="text-sm text-gray-600">
                  Solicitado por: {request.user?.fullName || request.citizenName || 'N/A'}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={request.isApproved ? 'default' : 'secondary'}>
                    {request.isApproved ? 'Aprovada' : 'Pendente'}
                  </Badge>
                  {request.hasSpoken && <Badge variant="outline">Já falou</Badge>}
                  {request.isSpeaking && <Badge className="bg-green-600">Falando agora</Badge>}
                </div>
                {request.legislativeProcesses?.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {request.legislativeProcesses.length} processo(s) legislativo(s)
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {!request.isApproved && (
                  <>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleApproveSpeech(request.id, true)}
                      className="bg-green-50 hover:bg-green-100"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSpeechRequest(request.id)}
                      className="bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </>
                )}
                
                {request.isApproved && !request.hasSpoken && (
                  <Button 
                    size="sm"
                    variant={request.isSpeaking ? "destructive" : "default"}
                    onClick={() => handleSetSpeaking(request.id, !request.isSpeaking)}
                    className={request.isSpeaking ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                  >
                    <Mic className="h-4 w-4 mr-1" />
                    {request.isSpeaking ? 'Parar Fala' : 'Iniciar Fala'}
                  </Button>
                )}
                
                {request.hasSpoken && (
                  <Badge variant="outline">Concluído</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [sessionPhase, setSessionPhase] = useState('SCHEDULED')
  const [documents, setDocuments] = useState<any[]>([])
  const [readingDocument, setReadingDocument] = useState<string | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const [timerDuration, setTimerDuration] = useState(300) // 5 minutos
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [activeVoting, setActiveVoting] = useState<any>(null)
  
  // Estados para o modal de adicionar documento
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false)
  const [documentPhase, setDocumentPhase] = useState('')
  const [documentForm, setDocumentForm] = useState({
    title: '',
    type: '',
    content: '',
    author: ''
  })

  // Buscar dados reais da sessão
  useEffect(() => {
    fetchSessionData()
    
    // Polling mais eficiente para o admin
    const interval = setInterval(fetchSessionData, 2000) // 2 segundos
    return () => clearInterval(interval)
  }, [])

  const fetchSessionData = async () => {
    try {
      const response = await fetch('/api/public/current-session')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setCurrentSession(data)
          setSessionPhase(data.status)
          setTimerActive(!!data.timer?.isActive)
        }
      }

      // Buscar documentos da sessão
      const docsResponse = await fetch('/api/session/documents')
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocuments(docsData)
      }

      // Buscar status da chamada de presença
      const attendanceResponse = await fetch('/api/public/attendance')
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        if (attendanceData) {
          setAttendanceOpen(attendanceData.isAttendanceOpen)
        }
      }

      // Buscar votação ativa
      const votingResponse = await fetch('/api/admin/voting')
      if (votingResponse.ok) {
        const votingData = await votingResponse.json()
        setActiveVoting(votingData.activeVoting)
      }
    } catch (error) {
      console.error('Erro ao buscar dados da sessão:', error)
    }
  }

  const startPhase = async (phase: string) => {
    try {
      const response = await fetch('/api/session/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: phase })
      })
      if (response.ok) {
        setSessionPhase(phase)
        await fetchSessionData()
      }
    } catch (error) {
      console.error('Erro ao iniciar fase:', error)
    }
  }

  // Controlar qual documento está sendo lido no painel
  const setDocumentReading = async (documentId: string, isReading: boolean) => {
    try {
      const response = await fetch('/api/admin/set-reading-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, isReading })
      })
      if (response.ok) {
        setReadingDocument(isReading ? documentId : null)
        await fetchSessionData()
      }
    } catch (error) {
      console.error('Erro ao definir documento em leitura:', error)
    }
  }

  // Controlar timer
  const handleTimerControl = async (action: 'start' | 'stop', phase?: string) => {
    try {
      const response = await fetch('/api/admin/timer-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: currentSession?.id,
          action,
          duration: timerDuration,
          phase: phase || 'CONSIDERAÇÕES FINAIS'
        })
      })
      if (response.ok) {
        setTimerActive(action === 'start')
        await fetchSessionData()
      }
    } catch (error) {
      console.error('Erro ao controlar timer:', error)
    }
  }

  // Controlar sessão (iniciar/encerrar)
  const handleSessionControl = async (action: 'start' | 'end') => {
    if (!currentSession?.id) return

    try {
      const response = await fetch('/api/admin/session-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: currentSession.id,
          action
        })
      })
      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        await fetchSessionData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao controlar sessão')
      }
    } catch (error) {
      console.error('Erro ao controlar sessão:', error)
      toast.error('Erro ao controlar sessão')
    }
  }

  // Controlar chamada de presença
  const handleAttendanceControl = async (action: 'start' | 'end') => {
    if (!currentSession?.id) return

    try {
      const actionText = action === 'start' ? 'Iniciando' : 'Encerrando'
      toast.loading(`⚡ ${actionText} chamada de presença...`, { id: 'attendance-control' })
      
      const response = await fetch('/api/admin/attendance-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: currentSession.id,
          action
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setAttendanceOpen(action === 'start')
        await fetchSessionData()
        
        if (action === 'start') {
          toast.success('📋 Chamada de presença iniciada! Painel público exibindo lista de vereadores.', { 
            id: 'attendance-control',
            duration: 4000
          })
          
          if (confirm('Deseja abrir o painel público para acompanhar as presenças?')) {
            window.open('/painel', '_blank')
          }
        } else {
          toast.success('✅ Chamada de presença encerrada com sucesso!', { id: 'attendance-control' })
        }
      } else {
        const error = await response.json()
        toast.error(`❌ ${error.error || 'Erro ao controlar chamada'}`, { id: 'attendance-control' })
      }
    } catch (error) {
      console.error('Erro ao controlar chamada:', error)
      toast.error('❌ Erro de conexão ao controlar chamada', { id: 'attendance-control' })
    }
  }

  const getPhaseTitle = (phase: string) => {
    const phases: Record<string, string> = {
      'SCHEDULED': 'Agendada',
      'PEQUENO_EXPEDIENTE': 'Pequeno Expediente', 
      'GRANDE_EXPEDIENTE': 'Grande Expediente',
      'ORDEM_DO_DIA': 'Ordem do Dia',
      'CONSIDERACOES_FINAIS': 'Considerações Finais',
      'TRIBUNA_LIVE': 'Tribuna Livre',
      'CLOSED': 'Encerrada'
    }
    return phases[phase] || phase
  }

  const handleStartVoting = async (matterId: string) => {
    // Confirmar antes de iniciar a votação
    if (!confirm('Deseja iniciar a votação desta matéria? A votação será exibida no painel público.')) {
      return
    }

    try {
      console.log('🚀 Iniciando votação para matéria:', matterId)
      toast.loading('⚡ Iniciando votação e sincronizando painel...', { id: 'voting-start' })
      
      const requestBody = {
        action: 'start',
        type: 'matter',
        itemId: matterId
      }
      console.log('📤 Dados da requisição:', requestBody)
      
      const response = await fetch('/api/admin/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Status da resposta:', response.status)
      console.log('📥 Headers da resposta:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Resultado da API:', result)
        
        // Atualizar dados do admin imediatamente
        await fetchSessionData()
        
        // Feedback aprimorado
        toast.success('🗳️ Votação iniciada! O painel público foi atualizado automaticamente.', { 
          id: 'voting-start',
          duration: 4000 
        })
        
        // Abrir painel público automaticamente se solicitado
        if (confirm('Deseja abrir o painel público para acompanhar a votação?')) {
          window.open('/painel', '_blank')
        }
        
      } else {
        const errorText = await response.text()
        console.error('❌ Erro da API (texto bruto):', errorText)
        
        let error
        try {
          error = JSON.parse(errorText)
          console.error('❌ Erro da API (JSON):', error)
        } catch {
          error = { error: errorText || `Erro HTTP ${response.status}` }
        }
        
        toast.error(`❌ ${error.error || 'Erro ao iniciar votação'} (Status: ${response.status})`, { 
          id: 'voting-start',
          duration: 6000 
        })
      }
    } catch (error) {
      console.error('❌ Erro completo:', error)
      toast.error(`❌ Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { 
        id: 'voting-start',
        duration: 6000 
      })
    }
  }

  const handleEndVoting = async (type: 'matter' | 'document', itemId: string, itemTitle: string) => {
    // Confirmar antes de encerrar a votação
    if (!confirm(`Deseja ENCERRAR a votação "${itemTitle}"? Esta ação não pode ser desfeita e o resultado será calculado automaticamente.`)) {
      return
    }

    try {
      toast.loading('Encerrando votação...', { id: 'voting-end' })
      
      const response = await fetch('/api/admin/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'end',
          type,
          itemId 
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success('✅ Votação encerrada com sucesso! Resultado calculado.', { id: 'voting-end' })
        
        // Mostrar resultado temporariamente no painel público
        await showVotingResult(result, itemTitle)
        await fetchSessionData()
      } else {
        const error = await response.json()
        toast.error(`❌ ${error.error || 'Erro ao encerrar votação'}`, { id: 'voting-end' })
      }
    } catch (error) {
      toast.error('❌ Erro de conexão ao encerrar votação', { id: 'voting-end' })
    }
  }

  const showVotingResult = async (result: any, title: string) => {
    // Enviar resultado para o painel público por alguns segundos
    try {
      const response = await fetch('/api/admin/show-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          result: {
            ...result,
            title
          }
        })
      })
      
      if (response.ok) {
        toast.success('📊 Resultado enviado para o painel público por 10 segundos')
      }
    } catch (error) {
      console.log('Erro ao mostrar resultado no painel público:', error)
    }
  }

  const handleViewHistory = () => {
    alert('Funcionalidade de Histórico em desenvolvimento!')
  }

  const handleViewDocument = async (docId: string, docTitle: string, docContent?: string) => {
    // Criar um modal de visualização ou abrir uma nova janela
    const content = docContent || `Conteúdo do documento: ${docTitle}\n\nEste é um documento da sessão legislativa que será exibido no painel público quando selecionado.`
    
    const newWindow = window.open('', '_blank', 'width=800,height=600')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Visualizar: ${docTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${docTitle}</h1>
            <div class="content">
              <pre style="white-space: pre-wrap;">${content}</pre>
            </div>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  const handleViewMatter = async (matterId: string, matterTitle: string) => {
    // Visualizar uma matéria específica
    const content = `Matéria: ${matterTitle}\n\nDescrição: Esta é uma matéria legislativa em tramitação na Câmara de Vereadores.\n\nStatus: Aguardando votação\n\nEsta matéria será submetida à aprovação dos vereadores presentes na sessão.`
    
    const newWindow = window.open('', '_blank', 'width=800,height=600')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Matéria: ${matterTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
              .voting-info { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #f59e0b; }
            </style>
          </head>
          <body>
            <h1>${matterTitle}</h1>
            <div class="content">
              <pre style="white-space: pre-wrap;">${content}</pre>
            </div>
            <div class="voting-info">
              <strong>⚠️ Informação de Votação:</strong><br>
              Esta matéria pode ser submetida à votação pelos vereadores presentes na sessão.
            </div>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  const handleVoteDocument = async (docId: string) => {
    // Confirmar antes de iniciar a votação do documento
    if (!confirm('Deseja iniciar a votação deste documento? A votação será exibida no painel público.')) {
      return
    }

    try {
      toast.loading('Iniciando votação do documento...', { id: 'doc-voting-start' })
      
      const response = await fetch('/api/admin/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          type: 'document',
          itemId: docId
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('✅ Votação de documento iniciada! Verifique o painel público.', { id: 'doc-voting-start' })
        await fetchSessionData() // Atualizar dados
      } else {
        const error = await response.json()
        toast.error(`❌ ${error.error || 'Erro ao iniciar votação do documento'}`, { id: 'doc-voting-start' })
      }
    } catch (error) {
      toast.error('❌ Erro de conexão ao iniciar votação do documento', { id: 'doc-voting-start' })
      console.error('Erro:', error)
    }
  }

  const handleAddDocument = (phase: string) => {
    // Definir o tipo de documento baseado na fase
    const documentTypes: Record<string, string[]> = {
      'PEQUENO_EXPEDIENTE': ['ATA_ANTERIOR', 'DISPENSA_ATA'],
      'GRANDE_EXPEDIENTE': ['REQUERIMENTO', 'PROJETO'],
      'ORDEM_DO_DIA': ['PROJETO', 'REQUERIMENTO']
    }
    
    setDocumentPhase(phase)
    setDocumentForm({
      title: '',
      type: documentTypes[phase]?.[0] || 'REQUERIMENTO',
      content: '',
      author: ''
    })
    setIsAddDocumentOpen(true)
  }

  const handleSaveDocument = async () => {
    // Validação básica
    if (!documentForm.title || !documentForm.type || !documentForm.content) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (!currentSession?.id) {
      toast.error('Nenhuma sessão ativa encontrada')
      return
    }

    try {
      toast.loading('Salvando documento...', { id: 'save-document' })
      
      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...documentForm,
          sessionId: currentSession.id
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('✅ Documento adicionado com sucesso!', { id: 'save-document' })
        
        // Resetar formulário e fechar modal
        setDocumentForm({
          title: '',
          type: '',
          content: '',
          author: ''
        })
        setDocumentPhase('')
        setIsAddDocumentOpen(false)
        
        // Atualizar lista de documentos
        await fetchSessionData()
      } else {
        const error = await response.json()
        toast.error(`❌ ${error.error || 'Erro ao salvar documento'}`, { id: 'save-document' })
      }
    } catch (error) {
      console.error('Erro ao salvar documento:', error)
      toast.error('❌ Erro de conexão ao salvar documento', { id: 'save-document' })
    }
  }

  const resetDocumentForm = () => {
    setDocumentForm({
      title: '',
      type: '',
      content: '',
      author: ''
    })
    setDocumentPhase('')
    setIsAddDocumentOpen(false)
  }

  const handleApproveSpeech = (speechId: string) => {
    alert(`Aprovando solicitação de fala ID: ${speechId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Controle de Sessão - Administrador
          </h1>
          <p className="text-gray-600">
            Gestão completa das fases da sessão e controle do painel público
          </p>
        </div>

        {/* Session Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  {currentSession?.title || 'Sessão Nº ' + (currentSession?.sessionNumber || '001')}
                </h3>
                <p className="text-sm text-blue-700">
                  Fase atual: {getPhaseTitle(sessionPhase)} • Administrador controla todas as etapas
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={sessionPhase === 'SCHEDULED' ? 'secondary' : 'default'}>
                {getPhaseTitle(sessionPhase)}
              </Badge>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.open('/painel', '_blank')}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Ver Painel Público
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" onClick={() => setActiveTab('overview')}>Visão Geral</TabsTrigger>
            <TabsTrigger value="painel" onClick={() => setActiveTab('painel')}>Painel Público</TabsTrigger>
            <TabsTrigger value="pequeno" onClick={() => setActiveTab('pequeno')}>Pequeno Expediente</TabsTrigger>
            <TabsTrigger value="grande" onClick={() => setActiveTab('grande')}>Grande Expediente</TabsTrigger>
            <TabsTrigger value="ordem" onClick={() => setActiveTab('ordem')}>Ordem do Dia</TabsTrigger>
            <TabsTrigger value="consideracoes" onClick={() => setActiveTab('consideracoes')}>Considerações</TabsTrigger>
            <TabsTrigger value="tribuna" onClick={() => setActiveTab('tribuna')}>Tribuna Live</TabsTrigger>
          </TabsList>

          {/* CONTROLE DO PAINEL PÚBLICO */}
          <TabsContent value="painel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  Controle do Painel Público
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Controle de Documentos em Leitura */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Documento sendo Exibido
                  </h4>
                  
                  <div className="grid gap-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h5 className="font-medium">{doc.title}</h5>
                          <p className="text-sm text-gray-600">{doc.type} - {doc.author || 'Autor não informado'}</p>
                        </div>
                        <div className="flex gap-2">
                          {readingDocument === doc.id ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDocumentReading(doc.id, false)}
                            >
                              <StopCircle className="h-4 w-4 mr-1" />
                              Parar Leitura
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDocumentReading(doc.id, true)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Exibir no Painel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controle de Timer */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Timer para Considerações Finais
                  </h4>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Duração (minutos):</label>
                      <Input
                        type="number"
                        value={Math.floor(timerDuration / 60)}
                        onChange={(e) => setTimerDuration(parseInt(e.target.value) * 60)}
                        className="w-20"
                        min="1"
                        max="30"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      {!timerActive ? (
                        <Button
                          onClick={() => handleTimerControl('start')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar Timer
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          onClick={() => handleTimerControl('stop')}
                        >
                          <StopCircle className="h-4 w-4 mr-1" />
                          Parar Timer
                        </Button>
                      )}
                    </div>
                  </div>

                  {timerActive && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800 font-medium">
                        ⏱️ Timer ativo no painel público - Considerações Finais
                      </p>
                    </div>
                  )}
                </div>

                {/* Status do Painel */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold mb-3">Status Atual do Painel</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>Fase:</strong> {getPhaseTitle(sessionPhase)}
                      </div>
                      <div>
                        <strong>Documento:</strong> {readingDocument ? 'Em exibição' : 'Nenhum'}
                      </div>
                      <div>
                        <strong>Timer:</strong> {timerActive ? 'Ativo' : 'Parado'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            {/* Controle Principal da Sessão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-blue-600" />
                  Controle Principal da Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {/* Iniciar/Encerrar Sessão */}
                  {sessionPhase === 'SCHEDULED' ? (
                    <Button 
                      onClick={() => handleSessionControl('start')}
                      className="h-16 bg-green-600 hover:bg-green-700 flex flex-col items-center"
                      disabled={!currentSession}
                    >
                      <Play className="h-6 w-6 mb-1" />
                      <span className="text-sm">Iniciar Sessão</span>
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSessionControl('end')}
                      className="h-16 bg-red-600 hover:bg-red-700 flex flex-col items-center"
                      disabled={!currentSession}
                    >
                      <StopCircle className="h-6 w-6 mb-1" />
                      <span className="text-sm">Encerrar Sessão</span>
                    </Button>
                  )}
                  
                  {/* Controle de Quórum */}
                  {sessionPhase !== 'SCHEDULED' && sessionPhase !== 'CLOSED' && (
                    attendanceOpen ? (
                      <Button 
                        onClick={() => handleAttendanceControl('end')}
                        className="h-16 bg-orange-600 hover:bg-orange-700 flex flex-col items-center"
                      >
                        <CheckCircle className="h-6 w-6 mb-1" />
                        <span className="text-sm">Encerrar Quórum</span>
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleAttendanceControl('start')}
                        className="h-16 bg-blue-600 hover:bg-blue-700 flex flex-col items-center"
                      >
                        <Users className="h-6 w-6 mb-1" />
                        <span className="text-sm">Iniciar Quórum</span>
                      </Button>
                    )
                  )}

                  {/* Ver Painel Público */}
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/painel', '_blank')}
                    className="h-16 flex flex-col items-center hover:bg-gray-50"
                  >
                    <Monitor className="h-6 w-6 mb-1" />
                    <span className="text-sm">Ver Painel Público</span>
                  </Button>
                </div>

                {/* Status atual */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Status da Sessão:</strong> {getPhaseTitle(sessionPhase)}
                    </div>
                    <div>
                      <strong>Chamada:</strong> {attendanceOpen ? 'Aberta' : 'Fechada'}
                    </div>
                    <div>
                      <strong>Timer:</strong> {timerActive ? 'Ativo' : 'Parado'}
                    </div>
                  </div>
                </div>

                {/* Controle de Votação Ativa */}
                {activeVoting && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Vote className="h-6 w-6 text-red-600" />
                        <div>
                          <h3 className="font-semibold text-red-800">
                            🗳️ VOTAÇÃO EM ANDAMENTO
                          </h3>
                          <p className="text-sm text-red-600">
                            {activeVoting.title} ({activeVoting.type === 'matter' ? 'Matéria' : 'Documento'})
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-green-700">✅ Favorável: {activeVoting.votes.yes}</span>
                            <span className="text-red-700">❌ Contrário: {activeVoting.votes.no}</span>
                            <span className="text-yellow-700">⚪ Abstenção: {activeVoting.votes.abstention}</span>
                            <span className="text-gray-700">Total: {activeVoting.votes.yes + activeVoting.votes.no + activeVoting.votes.abstention}/{activeVoting.totalVoters}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleEndVoting(activeVoting.type, activeVoting.id, activeVoting.title)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <StopCircle className="h-4 w-4 mr-1" />
                        Encerrar Votação
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controle das Fases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-600" />
                  Controle das Fases da Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => startPhase('PEQUENO_EXPEDIENTE')}
                    className="h-20 bg-blue-600 hover:bg-blue-700 flex flex-col items-center"
                  >
                    <Clock className="h-6 w-6 mb-2" />
                    Pequeno Expediente
                  </Button>
                  <Button 
                    onClick={() => startPhase('GRANDE_EXPEDIENTE')}
                    className="h-20 bg-purple-600 hover:bg-purple-700 flex flex-col items-center"
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    Grande Expediente
                  </Button>
                  <Button 
                    onClick={() => startPhase('ORDEM_DO_DIA')}
                    className="h-20 bg-red-600 hover:bg-red-700 flex flex-col items-center"
                  >
                    <Vote className="h-6 w-6 mb-2" />
                    Ordem do Dia
                  </Button>
                  <Button 
                    onClick={() => startPhase('CONSIDERACOES_FINAIS')}
                    className="h-20 bg-green-600 hover:bg-green-700 flex flex-col items-center"
                  >
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Considerações Finais
                  </Button>
                  <Button 
                    onClick={() => startPhase('TRIBUNA_LIVE')}
                    className="h-20 bg-yellow-600 hover:bg-yellow-700 flex flex-col items-center"
                  >
                    <Mic className="h-6 w-6 mb-2" />
                    Tribuna Livre
                  </Button>
                  <Button 
                    onClick={() => startPhase('CLOSED')}
                    className="h-20 bg-gray-600 hover:bg-gray-700 flex flex-col items-center"
                  >
                    <CheckCircle className="h-6 w-6 mb-2" />
                    Encerrar Sessão
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vereadores</p>
                      <p className="text-2xl font-bold">13</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Presenças</p>
                      <p className="text-2xl font-bold">11</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Matérias</p>
                      <p className="text-2xl font-bold">5</p>
                    </div>
                    <Vote className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <p className="text-xl font-bold text-green-600">Ativo</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PEQUENO EXPEDIENTE */}
          <TabsContent value="pequeno" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Pequeno Expediente - Documentos Oficiais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Documentos Mock para demonstração */}
                  {[
                    { id: '1', title: 'Ata da Sessão Anterior - 15/09/2024', type: 'ATA_ANTERIOR', isApproved: null },
                    { id: '2', title: 'Dispensa da Leitura da Ata', type: 'DISPENSA_ATA', isApproved: null }
                  ].map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-gray-600">{doc.type}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDocument(doc.id, doc.title)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleVoteDocument(doc.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Vote className="h-4 w-4 mr-1" />
                          Votar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t mt-6">
                  <Button onClick={() => handleAddDocument('PEQUENO_EXPEDIENTE')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Documento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GRANDE EXPEDIENTE */}
          <TabsContent value="grande" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Grande Expediente - Requerimentos e Projetos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: '3', title: 'Requerimento 001/2024 - Obras Públicas', type: 'REQUERIMENTO' },
                    { id: '4', title: 'Projeto de Lei 005/2024 - Horários', type: 'PROJETO' }
                  ].map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-gray-600">{doc.type}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDocument(doc.id, doc.title)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => toast.success('Documento movido para Ordem do Dia')}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Para Ordem do Dia
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t mt-6">
                  <Button onClick={() => handleAddDocument('GRANDE_EXPEDIENTE')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Documento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ORDEM DO DIA */}
          <TabsContent value="ordem" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5 text-red-600" />
                  Ordem do Dia - Votações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: '1', title: 'Aprovação do Orçamento Municipal 2024', status: 'PENDING' },
                    { id: '2', title: 'Lei do Plano Diretor - Alterações', status: 'PENDING' },
                    { id: '3', title: 'Programa Jovem Empreendedor', status: 'PENDING' }
                  ].map((matter) => (
                    <div key={matter.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{matter.title}</h4>
                        <Badge variant="secondary">{matter.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewMatter(matter.id, matter.title)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleStartVoting(matter.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Vote className="h-4 w-4 mr-1" />
                          Iniciar Votação
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONSIDERAÇÕES FINAIS */}
          <TabsContent value="consideracoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Considerações Finais - Solicitações de Fala
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConsideracoesFinaisTab />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRIBUNA LIVRE */}
          <TabsContent value="tribuna" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-yellow-600" />
                  Tribuna Livre - Manifestações Públicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Mic className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Tribuna Livre Ativa</h3>
                  <p className="text-gray-600 mb-4">
                    Espaço aberto para manifestações do público presente
                  </p>
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    <Clock className="h-4 w-4 mr-1" />
                    Controlar Tempo de Fala
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Modal para Adicionar Documentos */}
        <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Documento</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Título do Documento */}
              <div>
                <label className="text-sm font-medium block mb-1">Título do Documento *</label>
                <Input
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm({...documentForm, title: e.target.value})}
                  placeholder="Ex: Projeto de Lei 001/2024 - Alteração do Código Tributário"
                  className="w-full"
                />
              </div>
              
              {/* Tipo de Documento */}
              <div>
                <label className="text-sm font-medium block mb-1">Tipo de Documento *</label>
                <Select 
                  value={documentForm.type} 
                  onValueChange={(value) => setDocumentForm({...documentForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentPhase === 'PEQUENO_EXPEDIENTE' && (
                      <>
                        <SelectItem value="ATA_ANTERIOR">Ata da Sessão Anterior</SelectItem>
                        <SelectItem value="DISPENSA_ATA">Dispensa da Leitura da Ata</SelectItem>
                      </>
                    )}
                    {documentPhase === 'GRANDE_EXPEDIENTE' && (
                      <>
                        <SelectItem value="REQUERIMENTO">Requerimento</SelectItem>
                        <SelectItem value="PROJETO">Projeto</SelectItem>
                      </>
                    )}
                    {documentPhase === 'ORDEM_DO_DIA' && (
                      <>
                        <SelectItem value="PROJETO">Projeto</SelectItem>
                        <SelectItem value="REQUERIMENTO">Requerimento</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Autor */}
              <div>
                <label className="text-sm font-medium block mb-1">Autor</label>
                <Input
                  value={documentForm.author}
                  onChange={(e) => setDocumentForm({...documentForm, author: e.target.value})}
                  placeholder="Ex: Vereador João Silva"
                  className="w-full"
                />
              </div>
              
              {/* Conteúdo do Documento */}
              <div>
                <label className="text-sm font-medium block mb-1">Conteúdo do Documento *</label>
                <Textarea
                  value={documentForm.content}
                  onChange={(e) => setDocumentForm({...documentForm, content: e.target.value})}
                  placeholder="Descreva o conteúdo principal do documento..."
                  className="w-full min-h-[120px]"
                />
              </div>
              
              {/* Fase (somente leitura) */}
              <div>
                <label className="text-sm font-medium block mb-1">Fase da Sessão</label>
                <Input
                  value={documentPhase.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  disabled
                  className="w-full bg-gray-100"
                />
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveDocument}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Salvar Documento
              </Button>
              <Button 
                variant="outline"
                onClick={resetDocumentForm}
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
