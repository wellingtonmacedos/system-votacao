
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-hot-toast"
import { UserCheck, FileText, Vote, Clock, CircleCheck as CheckCircle, Circle as XCircle, Minus, Info, MessageSquare, Plus, CreditCard as Edit, Trash2, BookOpen, Calendar } from "lucide-react"

export function CouncilorDashboard() {
  const { data: session } = useSession() || {}
  const [isPresent, setIsPresent] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [speechRequests, setSpeechRequests] = useState<any[]>([])
  const [legislativeProcesses, setLegislativeProcesses] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  
  // Estados para formulários
  const [speechForm, setSpeechForm] = useState({
    subject: '',
    type: 'CONSIDERACOES_FINAIS'
  })
  const [processForm, setProcessForm] = useState({
    number: '',
    title: '',
    description: '',
    type: 'PROJETO_LEI'
  })
  const [editingProcess, setEditingProcess] = useState<any>(null)

  useEffect(() => {
    fetchData()
    // Atualizar dados a cada 5 segundos quando a chamada estiver aberta
    const interval = setInterval(() => {
      if (attendanceData?.isAttendanceOpen) {
        fetchData()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [attendanceData?.isAttendanceOpen])

  useEffect(() => {
    fetchData()
  }, [session?.user?.id])

  const fetchData = async () => {
    try {
      // Buscar sessão atual
      const sessionResponse = await fetch('/api/public/current-session')
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        setCurrentSession(sessionData)
      }

      // Buscar dados de presença
      const attendanceResponse = await fetch('/api/public/attendance')
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        setAttendanceData(attendanceData)
        
        // Verificar se o usuário já registrou presença
        if (attendanceData && session?.user?.id) {
          const userAttendance = attendanceData.attendances.find((att: any) => att.user.id === session.user.id)
          setIsPresent(userAttendance?.isPresent || false)
        }
      }

      // Buscar solicitações de fala do usuário
      const speechResponse = await fetch('/api/speech-request')
      if (speechResponse.ok) {
        const speechData = await speechResponse.json()
        setSpeechRequests(speechData.filter((req: any) => req.userId === session?.user?.id))
      }

      // Buscar processos legislativos do usuário
      const processResponse = await fetch('/api/legislative-process')
      if (processResponse.ok) {
        const processData = await processResponse.json()
        setLegislativeProcesses(processData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleMarkPresence = async () => {
    if (!currentSession?.id) {
      toast.error('Nenhuma sessão ativa encontrada')
      return
    }

    if (!attendanceData?.isAttendanceOpen) {
      toast.error('A chamada de presença não está aberta no momento')
      return
    }

    try {
      const response = await fetch('/api/attendance/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession.id })
      })

      if (response.ok) {
        setIsPresent(true)
        toast.success('Presença registrada com sucesso!')
        await fetchData() // Atualizar dados
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao registrar presença')
      }
    } catch (error) {
      console.error('Erro ao registrar presença:', error)
      toast.error('Erro ao registrar presença')
    }
  }

  const handleSpeechRequest = async () => {
    try {
      const response = await fetch('/api/speech-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(speechForm)
      })
      
      if (response.ok) {
        toast.success('Solicitação de fala enviada com sucesso!')
        setSpeechForm({ subject: '', type: 'CONSIDERACOES_FINAIS' })
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao enviar solicitação')
      }
    } catch (error) {
      toast.error('Erro ao enviar solicitação de fala')
    }
  }

  const handleCreateProcess = async () => {
    try {
      const response = await fetch('/api/legislative-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processForm)
      })
      
      if (response.ok) {
        toast.success('Processo legislativo criado com sucesso!')
        setProcessForm({ number: '', title: '', description: '', type: 'PROJETO_LEI' })
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar processo')
      }
    } catch (error) {
      toast.error('Erro ao criar processo legislativo')
    }
  }

  const handleUpdateProcess = async () => {
    if (!editingProcess) return
    
    try {
      const response = await fetch(`/api/legislative-process/${editingProcess.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingProcess.title,
          description: editingProcess.description,
          type: editingProcess.type
        })
      })
      
      if (response.ok) {
        toast.success('Processo atualizado com sucesso!')
        setEditingProcess(null)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar processo')
      }
    } catch (error) {
      toast.error('Erro ao atualizar processo')
    }
  }

  const handleDeleteProcess = async (processId: string) => {
    if (!confirm('Tem certeza que deseja excluir este processo?')) return
    
    try {
      const response = await fetch(`/api/legislative-process/${processId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Processo excluído com sucesso!')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir processo')
      }
    } catch (error) {
      toast.error('Erro ao excluir processo')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel do Vereador(a)
          </h1>
          <p className="text-gray-600">
            Bem-vindo(a), {session?.user?.name}
          </p>
        </div>

        {/* Session Status */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>
              {currentSession ? `Sessão Ativa: ${currentSession.title}` : 'Nenhuma sessão ativa no momento.'}
            </strong>
            {!currentSession && ' Aguarde o Presidente da Câmara abrir uma nova sessão para participar.'}
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="speech">Considerações Finais</TabsTrigger>
            <TabsTrigger value="processes">Processos Legislativos</TabsTrigger>
            <TabsTrigger value="voting">Votação</TabsTrigger>
          </TabsList>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            {/* Presence Status */}
            <Card className={`border-2 ${
              attendanceData?.isAttendanceOpen 
                ? (isPresent ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50')
                : 'border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Registro de Presença
                  {attendanceData?.isAttendanceOpen && (
                    <Badge className="bg-blue-600 text-white animate-pulse">
                      CHAMADA ABERTA
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status da chamada */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-2">
                        {attendanceData?.isAttendanceOpen ? (
                          isPresent 
                            ? "✅ Sua presença foi registrada com sucesso" 
                            : "⏰ Chamada de presença está ABERTA - Registre sua presença agora!"
                        ) : (
                          isPresent 
                            ? "✅ Você está presente nesta sessão"
                            : "❌ Chamada de presença não está aberta"
                        )}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>É necessário registrar presença para poder votar</p>
                        {attendanceData && (
                          <p>
                            Presentes: <strong>{attendanceData.presentCount} de {attendanceData.totalCount}</strong>
                            {attendanceData.hasQuorum ? (
                              <span className="text-green-600 ml-2">✓ Quórum atingido</span>
                            ) : (
                              <span className="text-red-600 ml-2">⚠ Falta quórum</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button 
                        onClick={handleMarkPresence}
                        disabled={isPresent || !attendanceData?.isAttendanceOpen}
                        className={isPresent ? "bg-green-600" : attendanceData?.isAttendanceOpen ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {isPresent ? "Presente ✓" : 
                         attendanceData?.isAttendanceOpen ? "Registrar Presença" : 
                         "Chamada Fechada"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Contador em tempo real */}
                  {attendanceData?.isAttendanceOpen && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Quórum necessário: {attendanceData.quorum} vereadores</span>
                        <span className={`font-bold ${attendanceData.hasQuorum ? 'text-green-600' : 'text-red-600'}`}>
                          {attendanceData.presentCount}/{attendanceData.totalCount} presentes
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Status da Sessão
                  </CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${currentSession ? 'text-blue-600' : 'text-gray-400'}`}>
                    {currentSession ? 'Ativa' : 'Inativa'}
                  </div>
                  <p className="text-xs text-gray-600">
                    {currentSession ? currentSession.status : 'Aguardando abertura'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Minhas Falas
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{speechRequests.length}</div>
                  <p className="text-xs text-gray-600">
                    Solicitações de fala
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Processos Legislativos
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{legislativeProcesses.length}</div>
                  <p className="text-xs text-gray-600">
                    Criados por mim
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Presença
                  </CardTitle>
                  <UserCheck className={`h-4 w-4 ${isPresent ? 'text-green-600' : 'text-gray-400'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isPresent ? 'text-green-600' : 'text-gray-400'}`}>
                    {isPresent ? 'Presente' : 'Ausente'}
                  </div>
                  <p className="text-xs text-gray-600">
                    Status atual
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONSIDERAÇÕES FINAIS */}
          <TabsContent value="speech" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Solicitar Fala nas Considerações Finais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Assunto da Fala</label>
                  <Input
                    value={speechForm.subject}
                    onChange={(e) => setSpeechForm(prev => ({...prev, subject: e.target.value}))}
                    placeholder="Ex: Questões sobre transporte público"
                  />
                </div>
                <Button onClick={handleSpeechRequest} disabled={!currentSession}>
                  <Plus className="h-4 w-4 mr-1" />
                  Solicitar Fala
                </Button>
              </CardContent>
            </Card>

            {/* Minhas Solicitações */}
            <Card>
              <CardHeader>
                <CardTitle>Minhas Solicitações de Fala</CardTitle>
              </CardHeader>
              <CardContent>
                {speechRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhuma solicitação de fala ainda</p>
                ) : (
                  <div className="space-y-3">
                    {speechRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{request.subject}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={request.isApproved ? 'default' : 'secondary'}>
                              {request.isApproved ? 'Aprovada' : 'Pendente'}
                            </Badge>
                            {request.hasSpoken && <Badge variant="outline">Já falou</Badge>}
                            {request.isSpeaking && <Badge className="bg-green-600">Falando agora</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROCESSOS LEGISLATIVOS */}
          <TabsContent value="processes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Criar Novo Processo Legislativo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Número do Processo</label>
                    <Input
                      value={processForm.number}
                      onChange={(e) => setProcessForm(prev => ({...prev, number: e.target.value}))}
                      placeholder="Ex: 001/2024"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={processForm.type}
                      onValueChange={(value) => setProcessForm(prev => ({...prev, type: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROJETO_LEI">Projeto de Lei</SelectItem>
                        <SelectItem value="REQUERIMENTO">Requerimento</SelectItem>
                        <SelectItem value="INDICACAO">Indicação</SelectItem>
                        <SelectItem value="MOCAO">Moção</SelectItem>
                        <SelectItem value="EMENDA">Emenda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Título/Ementa</label>
                  <Input
                    value={processForm.title}
                    onChange={(e) => setProcessForm(prev => ({...prev, title: e.target.value}))}
                    placeholder="Ex: Dispõe sobre melhorias no transporte público"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={processForm.description}
                    onChange={(e) => setProcessForm(prev => ({...prev, description: e.target.value}))}
                    placeholder="Descreva detalhadamente o processo legislativo"
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateProcess}>
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Processo
                </Button>
              </CardContent>
            </Card>

            {/* Meus Processos */}
            <Card>
              <CardHeader>
                <CardTitle>Meus Processos Legislativos</CardTitle>
              </CardHeader>
              <CardContent>
                {legislativeProcesses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum processo legislativo criado ainda</p>
                ) : (
                  <div className="space-y-3">
                    {legislativeProcesses.map((process) => (
                      <div key={process.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{process.number} - {process.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{process.type}</p>
                          <Badge variant="secondary" className="mt-2">{process.status}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProcess(process)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProcess(process.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VOTAÇÃO */}
          <TabsContent value="voting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5 text-purple-600" />
                  Painel de Votação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Vote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Votação Indisponível</p>
                  <p className="text-sm mb-4">
                    Aguardando início da votação pelo Administrador
                  </p>
                  
                  {/* Voting Buttons (Disabled) */}
                  <div className="flex justify-center gap-2">
                    <Button disabled variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      SIM
                    </Button>
                    <Button disabled variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-1" />
                      NÃO
                    </Button>
                    <Button disabled variant="outline" size="sm">
                      <Minus className="h-4 w-4 mr-1" />
                      ABSTENÇÃO
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para editar processo */}
      {editingProcess && (
        <Dialog open={!!editingProcess} onOpenChange={() => setEditingProcess(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Processo Legislativo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={editingProcess.title}
                  onChange={(e) => setEditingProcess((prev: any) => ({...prev, title: e.target.value}))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={editingProcess.type}
                  onValueChange={(value) => setEditingProcess((prev: any) => ({...prev, type: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROJETO_LEI">Projeto de Lei</SelectItem>
                    <SelectItem value="REQUERIMENTO">Requerimento</SelectItem>
                    <SelectItem value="INDICACAO">Indicação</SelectItem>
                    <SelectItem value="MOCAO">Moção</SelectItem>
                    <SelectItem value="EMENDA">Emenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={editingProcess.description}
                  onChange={(e) => setEditingProcess((prev: any) => ({...prev, description: e.target.value}))}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProcess}>Salvar</Button>
                <Button variant="outline" onClick={() => setEditingProcess(null)}>Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
