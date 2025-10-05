
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { documentId, isReading } = await request.json()

    // Primeiro, parar a leitura de todos os documentos
    await prisma.document.updateMany({
      data: {
        isBeingRead: false
      }
    })

    // Se isReading for true, definir este documento como sendo lido
    if (isReading && documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          isBeingRead: true
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao definir documento em leitura:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
