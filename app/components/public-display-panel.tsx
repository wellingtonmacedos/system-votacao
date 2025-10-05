
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Clock, Users, FileText, Vote, User, BookOpen, Mic, CheckCircle } from "lucide-react"

interface SessionData {
  id: string
  sessionNumber: string
  date: string
  status: string
  currentDocument?: {
    id: string
    title: string
    type: string
    content: string
    author: string
  }
  currentVoting?: {
    type: 'matter' | 'document'
    id: string
    title: string
    description: string
    documentType?: string
    author?: string
    votes: {
      yes: number
      no: number
      abstention: number
    }
    totalVoters: number
    isActive: boolean
  }
  timer?: {
    isActive: boolean
    timeRemaining: number
    phase: string
  }
}

interface CurrentSpeakerData {
  id: string
  subject: string
  user: {
    id: string
    fullName: string
  }
  legislativeProcesses: Array<{
    id: string
    number: string
    title: string
    description: string
    type: string
    status: string
  }>
}

interface AttendanceData {
  sessionId: string
  isAttendanceOpen: boolean
  attendanceStartedAt: string | null
  attendanceEndedAt: string | null
  quorum: number
  attendances: Array<{
    id: string
    isPresent: boolean
    arrivedAt: string | null
    user: {
      id: string
      fullName: string
      role: string
    }
  }>
  presentCount: number
  totalCount: number
  hasQuorum: boolean
}

export function PublicDisplayPanel() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [currentSpeaker, setCurrentSpeaker] = useState<CurrentSpeakerData | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [scrollPosition, setScrollPosition] = useState(0)
  const [votingVotes, setVotingVotes] = useState<any[]>([])
  const [votingResult, setVotingResult] = useState<any>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
  const [isUpdating, setIsUpdating] = useState(false)

  // Atualizar horário
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Buscar dados da sessão
  useEffect(() => {
    const fetchSessionData = async () => {
      setIsUpdating(true)
      try {
        // Buscar dados da sessão primeiro
        const response = await fetch('/api/public/current-session')
        if (response.ok) {
          const data = await response.json()
          setSessionData(data)

          // Se há votação ativa, buscar votos individuais imediatamente
          if (data && data.currentVoting && data.currentVoting.isActive) {
            const votesResponse = await fetch(
              `/api/vote?type=${data.currentVoting.type}&itemId=${data.currentVoting.id}`
            )
            if (votesResponse.ok) {
              const votesData = await votesResponse.json()
              setVotingVotes(votesData.votes || [])
            }
          } else {
            setVotingVotes([])
          }
        }

        // Buscar demais dados em paralelo para otimizar
        const [speakerResponse, attendanceResponse, resultResponse] = await Promise.all([
          fetch('/api/public/current-speaking'),
          fetch('/api/public/attendance'),
          fetch('/api/admin/show-result')
        ])

        // Processar resposta do speaker
        if (speakerResponse.ok) {
          const speakerData = await speakerResponse.json()
          setCurrentSpeaker(speakerData)
        } else {
          setCurrentSpeaker(null)
        }

        // Processar resposta da presença
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json()
          setAttendanceData(attendanceData)
        } else {
          setAttendanceData(null)
        }

        // Processar resposta do resultado
        if (resultResponse.ok) {
          const resultData = await resultResponse.json()
          setVotingResult(resultData.result)
        }
        
        // Atualizar timestamp da última atualização
        setLastUpdateTime(new Date())
      } catch (error) {
        console.error('Erro ao buscar dados da sessão:', error)
      } finally {
        setIsUpdating(false)
      }
    }

    // Fazer a primeira busca imediatamente
    fetchSessionData()
    
    // Sistema de intervalos adaptativos para melhor performance
    let currentInterval: NodeJS.Timeout
    
    const startAdaptivePolling = () => {
      const poll = async () => {
        await fetchSessionData()
        
        // Determinar intervalo baseado na atividade atual
        let nextInterval = 2000 // padrão: 2 segundos
        
        if (sessionData?.currentVoting?.isActive) {
          nextInterval = 800 // 0.8 segundos durante votações ativas
        } else if (attendanceData?.isAttendanceOpen) {
          nextInterval = 1200 // 1.2 segundos durante chamadas de presença
        } else if (sessionData?.status === 'CONSIDERACOES_FINAIS' || sessionData?.status === 'TRIBUNA_LIVE') {
          nextInterval = 1500 // 1.5 segundos durante falas
        } else {
          nextInterval = 3000 // 3 segundos em momentos normais
        }
        
        // Reagendar próxima execução
        currentInterval = setTimeout(poll, nextInterval)
      }
      
      // Iniciar primeiro ciclo
      currentInterval = setTimeout(poll, 1000) // primeira execução em 1 segundo
    }
    
    startAdaptivePolling()
    
    return () => {
      if (currentInterval) {
        clearTimeout(currentInterval)
      }
    }
  }, [])

  // Auto scroll para documentos
  useEffect(() => {
    if (!sessionData?.currentDocument) return

    const interval = setInterval(() => {
      setScrollPosition(prev => prev + 1)
    }, 50) // Scroll suave

    return () => clearInterval(interval)
  }, [sessionData?.currentDocument])

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PEQUENO_EXPEDIENTE: { label: "PEQUENO EXPEDIENTE", color: "bg-blue-500" },
      GRANDE_EXPEDIENTE: { label: "GRANDE EXPEDIENTE", color: "bg-green-500" },
      ORDEM_DO_DIA: { label: "ORDEM DO DIA", color: "bg-red-500" },
      CONSIDERACOES_FINAIS: { label: "CONSIDERAÇÕES FINAIS", color: "bg-purple-500" },
      TRIBUNA_LIVE: { label: "TRIBUNA LIVRE", color: "bg-yellow-500" },
      CLOSED: { label: "SESSÃO ENCERRADA", color: "bg-gray-500" }
    }
    return statusMap[status] || { label: status, color: "bg-gray-500" }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold mb-4">Carregando Painel Público</h2>
          <p className="text-xl opacity-80">Aguardando dados da sessão...</p>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusDisplay(sessionData.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm p-6 border-b border-white/20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              CÂMARA DE VEREADORES
            </h1>
            <p className="text-xl opacity-90">
              Sessão Nº {sessionData.sessionNumber} - {new Date(sessionData.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold mb-2">
              {currentTime.toLocaleTimeString('pt-BR')}
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`text-lg px-4 py-2 ${statusInfo.color} text-white border-0`}>
                {statusInfo.label}
              </Badge>
              
              {/* Indicador de atualização em tempo real */}
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isUpdating ? 'bg-green-400 animate-pulse' : 'bg-green-500'
                }`}></div>
                <span className="text-xs text-white/80 font-medium">
                  {isUpdating ? 'ATUALIZANDO' : 'AO VIVO'}
                </span>
              </div>
            </div>
            
            {/* Timestamp da última atualização */}
            <div className="mt-1 text-xs text-white/60">
              Última atualização: {lastUpdateTime.toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {/* Lista de Presença - Quando a chamada estiver aberta */}
        {attendanceData && attendanceData.isAttendanceOpen && (
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 h-full">
              <div className="relative mb-8">
                <div className="flex items-center justify-between">
                  {/* Título principal com gradiente */}
                  <div className="flex items-center">
                    <div className="relative">
                      <Users className="h-10 w-10 mr-4 text-emerald-400 drop-shadow-lg" />
                      <div className="absolute inset-0 h-10 w-10 mr-4 text-emerald-400/30 animate-ping"></div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 mb-1 tracking-wide">
                        CHAMADA DE PRESENÇA
                      </h3>
                      <p className="text-lg text-emerald-100/90 font-medium">
                        Registro de presença dos vereadores
                      </p>
                    </div>
                  </div>
                  
                  {/* Status do quórum com design elegante */}
                  <div className="text-right">
                    <div className={`inline-flex items-center px-6 py-3 rounded-2xl font-bold text-lg text-white shadow-2xl backdrop-blur-sm border-2 ${
                      attendanceData.hasQuorum 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-300/40 shadow-emerald-500/30' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 border-red-300/40 shadow-red-500/30'
                    }`}>
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        attendanceData.hasQuorum ? 'bg-white animate-pulse' : 'bg-white/80'
                      }`}></div>
                      {attendanceData.hasQuorum ? '✅ QUÓRUM ATINGIDO' : '⏳ AGUARDANDO QUÓRUM'}
                    </div>
                    
                    {/* Estatísticas elegantes */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-end">
                        <div className="text-right bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                          <div className="text-2xl font-bold text-white">
                            {attendanceData.presentCount}
                            <span className="text-lg font-normal text-white/70"> / {attendanceData.totalCount}</span>
                          </div>
                          <div className="text-xs text-white/80 uppercase tracking-wide">
                            Vereadores Presentes
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-emerald-300 font-medium bg-emerald-900/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-emerald-500/20">
                          🎯 Quórum necessário: {attendanceData.quorum} vereadores
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Barra de progresso do quórum */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span className="font-medium">Progresso do Quórum</span>
                    <span className="font-bold">
                      {Math.round((attendanceData.presentCount / attendanceData.quorum) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        attendanceData.hasQuorum 
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/50' 
                          : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min((attendanceData.presentCount / attendanceData.quorum) * 100, 100)}%`
                      }}
                    >
                      <div className="h-full bg-gradient-to-r from-white/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-200px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-2">
                  {attendanceData.attendances.map((attendance, index) => (
                    <div 
                      key={attendance.id}
                      className={`group relative overflow-hidden rounded-xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-1 ${
                        attendance.isPresent 
                          ? 'bg-gradient-to-br from-emerald-500/30 via-green-500/25 to-teal-500/20 border border-emerald-400/40 shadow-emerald-500/20' 
                          : 'bg-gradient-to-br from-slate-600/20 via-gray-500/15 to-slate-500/10 border border-gray-400/30 shadow-gray-500/10'
                      } shadow-xl backdrop-blur-sm hover:shadow-2xl`}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                      
                      {/* Status indicator no topo */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        attendance.isPresent 
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                          : 'bg-gradient-to-r from-gray-400 to-slate-500'
                      }`}></div>

                      <div className="relative p-5 text-center">
                        {/* Avatar com gradiente e sombra */}
                        <div className="relative mb-4">
                          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-all duration-300 group-hover:shadow-xl ${
                            attendance.isPresent 
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 ring-4 ring-emerald-400/30' 
                              : 'bg-gradient-to-br from-gray-500 to-slate-600 ring-4 ring-gray-400/20'
                          }`}>
                            <span className="drop-shadow-sm">
                              {attendance.user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </span>
                          </div>
                          
                          {/* Pulse animation para presentes */}
                          {attendance.isPresent && (
                            <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping"></div>
                          )}
                          
                          {/* Status badge no avatar */}
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                            attendance.isPresent ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {attendance.isPresent ? '✓' : '×'}
                          </div>
                        </div>
                        
                        {/* Nome do vereador */}
                        <h4 className="font-bold text-white text-sm mb-2 leading-tight tracking-wide">
                          {attendance.user.fullName.toUpperCase()}
                        </h4>
                        
                        {/* Partido com estilo elegante */}
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                          attendance.isPresent 
                            ? 'bg-white/20 text-emerald-100 border border-emerald-300/30' 
                            : 'bg-white/10 text-gray-300 border border-gray-400/20'
                        }`}>
                          {attendance.user.role}
                        </div>
                        
                        {/* Status badge principal */}
                        <div className="mb-3">
                          {attendance.isPresent ? (
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-xs shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                              PRESENTE
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-gray-500 to-slate-600 text-white font-bold text-xs shadow-lg">
                              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                              AUSENTE
                            </div>
                          )}
                        </div>

                        {/* Horário de chegada */}
                        {attendance.isPresent && attendance.arrivedAt && (
                          <div className="text-xs text-emerald-300 font-medium bg-emerald-900/30 rounded-lg px-2 py-1 backdrop-blur-sm">
                            📍 {new Date(attendance.arrivedAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>

                      {/* Decorative elements */}
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                        attendance.isPresent ? 'bg-emerald-400' : 'bg-gray-400'
                      } opacity-60`}></div>
                      <div className={`absolute bottom-2 left-2 w-1 h-1 rounded-full ${
                        attendance.isPresent ? 'bg-green-400' : 'bg-gray-400'
                      } opacity-40`}></div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Tela de Votação - Similar à de Presença */}
        {sessionData.currentVoting && sessionData.currentVoting.isActive && attendanceData && !attendanceData.isAttendanceOpen && (
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 h-full">
              <div className="relative mb-8">
                <div className="flex items-center justify-between">
                  {/* Título principal com gradiente */}
                  <div className="flex items-center">
                    <div className="relative">
                      <Vote className="h-10 w-10 mr-4 text-red-400 drop-shadow-lg" />
                      <div className="absolute inset-0 h-10 w-10 mr-4 text-red-400/30 animate-ping"></div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-red-200 mb-1 tracking-wide">
                        VOTAÇÃO EM ANDAMENTO
                      </h3>
                      <p className="text-lg text-red-100/90 font-medium">
                        {sessionData.currentVoting.title}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {sessionData.currentVoting.type === 'document' && sessionData.currentVoting.documentType && (
                          <Badge variant="outline" className="text-xs border-white/30 text-white/70">
                            {sessionData.currentVoting.documentType}
                          </Badge>
                        )}
                        {sessionData.currentVoting.type === 'matter' && (
                          <Badge variant="outline" className="text-xs border-white/30 text-white/70">
                            MATÉRIA
                          </Badge>
                        )}
                        {sessionData.currentVoting.author && (
                          <span className="text-xs text-white/60">
                            Autor: {sessionData.currentVoting.author}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Estatísticas da votação */}
                  <div className="text-right">
                    <div className="space-y-2">
                      <div className="flex gap-4 justify-end">
                        <div className="text-center bg-green-500/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-green-400/30">
                          <div className="text-2xl font-bold text-green-400">
                            {sessionData.currentVoting.votes.yes}
                          </div>
                          <div className="text-xs text-green-300 uppercase tracking-wide">
                            Favorável
                          </div>
                        </div>
                        <div className="text-center bg-red-500/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-red-400/30">
                          <div className="text-2xl font-bold text-red-400">
                            {sessionData.currentVoting.votes.no}
                          </div>
                          <div className="text-xs text-red-300 uppercase tracking-wide">
                            Contrário
                          </div>
                        </div>
                        <div className="text-center bg-yellow-500/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-yellow-400/30">
                          <div className="text-2xl font-bold text-yellow-400">
                            {sessionData.currentVoting.votes.abstention}
                          </div>
                          <div className="text-xs text-yellow-300 uppercase tracking-wide">
                            Abstenção
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-white/80 font-medium bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                          📊 {sessionData.currentVoting.votes.yes + sessionData.currentVoting.votes.no + sessionData.currentVoting.votes.abstention} / {sessionData.currentVoting.totalVoters} votaram
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-200px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-2">
                  {attendanceData.attendances
                    .filter(attendance => attendance.isPresent)
                    .map((attendance, index) => {
                      // Buscar o voto deste vereador
                      const userVote = votingVotes.find(vote => vote.user.id === attendance.user.id)
                      let voteColor = 'from-slate-600/20 via-gray-500/15 to-slate-500/10 border-gray-400/30'
                      let voteText = 'NÃO VOTOU'
                      let voteBadgeColor = 'bg-gray-500'
                      let voteIcon = '⏳'

                      if (userVote) {
                        if (userVote.voteType === 'YES') {
                          voteColor = 'from-emerald-500/30 via-green-500/25 to-teal-500/20 border-emerald-400/40'
                          voteText = 'FAVORÁVEL'
                          voteBadgeColor = 'bg-green-500'
                          voteIcon = '✓'
                        } else if (userVote.voteType === 'NO') {
                          voteColor = 'from-red-500/30 via-rose-500/25 to-red-500/20 border-red-400/40'
                          voteText = 'CONTRÁRIO'
                          voteBadgeColor = 'bg-red-500'
                          voteIcon = '✗'
                        } else if (userVote.voteType === 'ABSTENTION') {
                          voteColor = 'from-yellow-500/30 via-amber-500/25 to-orange-500/20 border-yellow-400/40'
                          voteText = 'ABSTENÇÃO'
                          voteBadgeColor = 'bg-yellow-500'
                          voteIcon = '○'
                        }
                      }

                      return (
                        <div 
                          key={attendance.id}
                          className={`group relative overflow-hidden rounded-xl transition-all duration-700 ease-out transform hover:scale-105 hover:-translate-y-1 bg-gradient-to-br ${voteColor} shadow-xl backdrop-blur-sm hover:shadow-2xl`}
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          {/* Efeito de brilho no hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                          
                          {/* Status indicator no topo */}
                          <div className={`absolute top-0 left-0 right-0 h-1 ${
                            userVote 
                              ? userVote.voteType === 'YES' ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                                userVote.voteType === 'NO' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                                'bg-gradient-to-r from-yellow-400 to-amber-500'
                              : 'bg-gradient-to-r from-gray-400 to-slate-500'
                          }`}></div>

                          <div className="relative p-5 text-center">
                            {/* Avatar com gradiente e sombra */}
                            <div className="relative mb-4">
                              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-all duration-300 group-hover:shadow-xl ${
                                userVote
                                  ? userVote.voteType === 'YES' ? 'bg-gradient-to-br from-emerald-500 to-green-600 ring-4 ring-emerald-400/30' :
                                    userVote.voteType === 'NO' ? 'bg-gradient-to-br from-red-500 to-rose-600 ring-4 ring-red-400/30' :
                                    'bg-gradient-to-br from-yellow-500 to-amber-600 ring-4 ring-yellow-400/30'
                                  : 'bg-gradient-to-br from-gray-500 to-slate-600 ring-4 ring-gray-400/20'
                              }`}>
                                <span className="drop-shadow-sm">
                                  {attendance.user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </span>
                              </div>
                              
                              {/* Pulse animation para quem já votou */}
                              {userVote && (
                                <div className={`absolute inset-0 rounded-full animate-ping ${
                                  userVote.voteType === 'YES' ? 'bg-emerald-400/30' :
                                  userVote.voteType === 'NO' ? 'bg-red-400/30' :
                                  'bg-yellow-400/30'
                                }`}></div>
                              )}
                              
                              {/* Status badge no avatar */}
                              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${voteBadgeColor}`}>
                                {voteIcon}
                              </div>
                            </div>
                            
                            {/* Nome do vereador */}
                            <h4 className="font-bold text-white text-sm mb-2 leading-tight tracking-wide">
                              {attendance.user.fullName.toUpperCase()}
                            </h4>
                            
                            {/* Partido */}
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                              userVote 
                                ? 'bg-white/20 text-white border border-white/30' 
                                : 'bg-white/10 text-gray-300 border border-gray-400/20'
                            }`}>
                              {attendance.user.role}
                            </div>
                            
                            {/* Status do voto */}
                            <div className="mb-3">
                              <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-bold text-xs shadow-lg ${
                                userVote
                                  ? userVote.voteType === 'YES' ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                                    userVote.voteType === 'NO' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                                    'bg-gradient-to-r from-yellow-500 to-amber-600'
                                  : 'bg-gradient-to-r from-gray-500 to-slate-600'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  userVote ? 'bg-white animate-pulse' : 'bg-gray-300'
                                }`}></div>
                                {voteText}
                              </div>
                            </div>

                            {/* Horário do voto */}
                            {userVote && (
                              <div className={`text-xs font-medium rounded-lg px-2 py-1 backdrop-blur-sm ${
                                userVote.voteType === 'YES' ? 'text-emerald-300 bg-emerald-900/30' :
                                userVote.voteType === 'NO' ? 'text-red-300 bg-red-900/30' :
                                'text-yellow-300 bg-yellow-900/30'
                              }`}>
                                🗳️ {new Date(userVote.votedAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>

                          {/* Decorative elements */}
                          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full opacity-60 ${
                            userVote 
                              ? userVote.voteType === 'YES' ? 'bg-emerald-400' :
                                userVote.voteType === 'NO' ? 'bg-red-400' :
                                'bg-yellow-400'
                              : 'bg-gray-400'
                          }`}></div>
                          <div className={`absolute bottom-2 left-2 w-1 h-1 rounded-full opacity-40 ${
                            userVote 
                              ? userVote.voteType === 'YES' ? 'bg-green-400' :
                                userVote.voteType === 'NO' ? 'bg-rose-400' :
                                'bg-amber-400'
                              : 'bg-gray-400'
                          }`}></div>
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Tela de Resultado da Votação (quando finalizada) */}
        {votingResult && (
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 h-full">
              <div className="text-center space-y-8">
                <div className="relative">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <CheckCircle className="h-16 w-16 text-green-400 drop-shadow-lg" />
                      <div className="absolute inset-0 h-16 w-16 text-green-400/30 animate-ping"></div>
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-green-200 mt-4 tracking-wide">
                    RESULTADO DA VOTAÇÃO
                  </h3>
                  <p className="text-xl text-green-100/90 font-medium mt-2">
                    {votingResult.title}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center bg-green-500/20 p-6 rounded-2xl backdrop-blur-sm border border-green-400/30">
                    <div className="text-5xl font-bold text-green-400 mb-2">
                      {votingResult.results.yes}
                    </div>
                    <div className="text-lg text-green-300 uppercase tracking-wide">
                      Favoráveis
                    </div>
                  </div>
                  <div className="text-center bg-red-500/20 p-6 rounded-2xl backdrop-blur-sm border border-red-400/30">
                    <div className="text-5xl font-bold text-red-400 mb-2">
                      {votingResult.results.no}
                    </div>
                    <div className="text-lg text-red-300 uppercase tracking-wide">
                      Contrários
                    </div>
                  </div>
                  <div className="text-center bg-yellow-500/20 p-6 rounded-2xl backdrop-blur-sm border border-yellow-400/30">
                    <div className="text-5xl font-bold text-yellow-400 mb-2">
                      {votingResult.results.abstention || 0}
                    </div>
                    <div className="text-lg text-yellow-300 uppercase tracking-wide">
                      Abstenções
                    </div>
                  </div>
                </div>

                <div className={`inline-flex items-center px-8 py-4 rounded-2xl font-bold text-2xl text-white shadow-2xl backdrop-blur-sm border-2 ${
                  votingResult.results.status === 'APPROVED' || votingResult.results.approved
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-300/40 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 border-red-300/40 shadow-red-500/30'
                }`}>
                  <div className={`w-4 h-4 rounded-full mr-4 bg-white animate-pulse`}></div>
                  {votingResult.results.status === 'APPROVED' || votingResult.results.approved ? '✅ APROVADO' : '❌ REJEITADO'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vereador Falando nas Considerações Finais */}
        {currentSpeaker && sessionData.status === 'CONSIDERACOES_FINAIS' && !attendanceData?.isAttendanceOpen && (
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 h-full">
              <div className="flex items-center mb-6">
                <Mic className="h-8 w-8 mr-3 text-green-400" />
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {currentSpeaker.user.fullName}
                  </h3>
                  <p className="text-lg opacity-80">
                    Considerações Finais - {currentSpeaker.subject}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge className="bg-green-600 text-white border-0 animate-pulse">
                    AO VIVO
                  </Badge>
                </div>
              </div>

              {/* Processos Legislativos do Vereador */}
              {currentSpeaker.legislativeProcesses.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <BookOpen className="h-6 w-6 mr-2 text-blue-400" />
                    <h4 className="text-xl font-semibold text-white">
                      Processos Legislativos do Vereador
                    </h4>
                  </div>
                  
                  <ScrollArea className="h-[calc(100%-180px)]">
                    <div className="space-y-4">
                      {currentSpeaker.legislativeProcesses.map((process) => (
                        <div key={process.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-white">
                              {process.number} - {process.title}
                            </h5>
                            <Badge 
                              variant="outline" 
                              className="text-xs border-white/30 text-white/80"
                            >
                              {process.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed">
                            {process.description}
                          </p>
                          <div className="mt-2">
                            <Badge 
                              className={`text-xs ${
                                process.status === 'EM_TRAMITACAO' ? 'bg-yellow-600' :
                                process.status === 'APROVADO' ? 'bg-green-600' :
                                'bg-red-600'
                              } text-white border-0`}
                            >
                              {process.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {/* Mensagem se não há processos */}
              {currentSpeaker.legislativeProcesses.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">
                      O vereador não possui processos legislativos cadastrados
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documento em Leitura (quando não há vereador falando e não há chamada aberta) */}
        {sessionData.currentDocument && (!currentSpeaker || sessionData.status !== 'CONSIDERACOES_FINAIS') && !attendanceData?.isAttendanceOpen && (
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 h-full">
              <div className="flex items-center mb-4">
                <FileText className="h-8 w-8 mr-3 text-yellow-400" />
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {sessionData.currentDocument.title}
                  </h3>
                  <p className="text-lg opacity-80">
                    {sessionData.currentDocument.type} - {sessionData.currentDocument.author}
                  </p>
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100%-100px)] pr-4">
                <div 
                  className="text-lg leading-relaxed text-white/90"
                  style={{
                    transform: `translateY(-${scrollPosition}px)`,
                    transition: 'transform 0.05s linear'
                  }}
                >
                  {sessionData.currentDocument.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Painel vazio quando não há conteúdo */}
        {!sessionData.currentDocument && !currentSpeaker && !attendanceData?.isAttendanceOpen && (
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <div className="text-center text-white/60">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">
                  {sessionData.status === 'CONSIDERACOES_FINAIS' ? 
                    'Aguardando vereador para considerações finais' :
                    'Nenhum documento sendo exibido no momento'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Votação Ativa */}
          {sessionData.currentVoting && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Vote className="h-8 w-8 mr-3 text-red-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white">VOTAÇÃO EM ANDAMENTO</h3>
                    <div className="space-y-1">
                      <p className="opacity-80">{sessionData.currentVoting.title}</p>
                      {sessionData.currentVoting.type === 'document' && sessionData.currentVoting.documentType && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs border-white/30 text-white/70">
                            {sessionData.currentVoting.documentType}
                          </Badge>
                          {sessionData.currentVoting.author && (
                            <span className="text-xs text-white/60">
                              Autor: {sessionData.currentVoting.author}
                            </span>
                          )}
                        </div>
                      )}
                      {sessionData.currentVoting.type === 'matter' && (
                        <Badge variant="outline" className="text-xs border-white/30 text-white/70">
                          MATÉRIA
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Votos SIM */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-400 font-semibold">FAVORÁVEL</span>
                      <span className="text-green-400 font-bold">
                        {sessionData.currentVoting.votes.yes}
                      </span>
                    </div>
                    <Progress 
                      value={(sessionData.currentVoting.votes.yes / sessionData.currentVoting.totalVoters) * 100}
                      className="h-3 bg-white/20"
                    />
                  </div>

                  {/* Votos NÃO */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-400 font-semibold">CONTRÁRIO</span>
                      <span className="text-red-400 font-bold">
                        {sessionData.currentVoting.votes.no}
                      </span>
                    </div>
                    <Progress 
                      value={(sessionData.currentVoting.votes.no / sessionData.currentVoting.totalVoters) * 100}
                      className="h-3 bg-white/20"
                    />
                  </div>

                  {/* Abstenções */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-yellow-400 font-semibold">ABSTENÇÃO</span>
                      <span className="text-yellow-400 font-bold">
                        {sessionData.currentVoting.votes.abstention}
                      </span>
                    </div>
                    <Progress 
                      value={(sessionData.currentVoting.votes.abstention / sessionData.currentVoting.totalVoters) * 100}
                      className="h-3 bg-white/20"
                    />
                  </div>

                  <div className="text-center pt-4 border-t border-white/20">
                    <div className="flex items-center justify-center">
                      <Users className="h-5 w-5 mr-2" />
                      <span className="font-semibold">
                        {sessionData.currentVoting.votes.yes + sessionData.currentVoting.votes.no + sessionData.currentVoting.votes.abstention} 
                        / {sessionData.currentVoting.totalVoters} votaram
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timer */}
          {sessionData.timer?.isActive && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 mr-3 text-orange-400" />
                  <h3 className="text-xl font-bold text-white">
                    {sessionData.timer.phase}
                  </h3>
                </div>
                
                <div className="text-6xl font-mono font-bold text-orange-400 mb-4">
                  {formatTimer(sessionData.timer.timeRemaining)}
                </div>
                
                <Progress 
                  value={sessionData.timer.timeRemaining > 0 ? (sessionData.timer.timeRemaining / 300) * 100 : 0}
                  className="h-3 bg-white/20"
                />
                
                <p className="text-sm opacity-80 mt-2">
                  Tempo restante
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informações da Sessão */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">STATUS DA SESSÃO</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="opacity-80">Data:</span>
                  <span className="font-semibold">
                    {new Date(sessionData.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="opacity-80">Sessão:</span>
                  <span className="font-semibold">Nº {sessionData.sessionNumber}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="opacity-80">Fase Atual:</span>
                  <Badge className={`${statusInfo.color} text-white border-0`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
