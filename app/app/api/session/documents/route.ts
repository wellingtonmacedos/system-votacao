
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar sessão ativa
    const currentSession = await prisma.votingSession.findFirst({
      where: {
        status: {
          not: 'CLOSED'
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    if (!currentSession) {
      return NextResponse.json([])
    }

    // Buscar todos os documentos da sessão
    const documents = await prisma.document.findMany({
      where: {
        sessionId: currentSession.id
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        creator: {
          select: {
            fullName: true
          }
        }
      }
    })

    const formattedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      content: doc.content || '',
      author: doc.author || doc.creator?.fullName || 'Autor desconhecido',
      description: doc.description || '',
      isBeingRead: doc.isBeingRead,
      orderIndex: doc.orderIndex,
      createdAt: doc.createdAt
    }))

    return NextResponse.json(formattedDocuments)
  } catch (error) {
    console.error('Erro ao buscar documentos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
