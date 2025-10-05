

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
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
      return NextResponse.json(null)
    }

    // Buscar lista de presença apenas se a chamada estiver aberta ou já tenha sido encerrada
    const attendances = await prisma.attendance.findMany({
      where: {
        sessionId: currentSession.id
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      },
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    });

    // Adicionar informações extras dos vereadores (foto e partido mock)
    const attendanceData = attendances.map(attendance => ({
      ...attendance,
      user: {
        ...attendance.user,
        // Mock data for photo and party
        photoUrl: `/images/vereadores/vereador-${attendance.user.id.slice(-2)}.jpg`,
        party: getPartyMock(attendance.user.fullName)
      }
    }));

    const responseData = {
      sessionId: currentSession.id,
      isAttendanceOpen: currentSession.isAttendanceOpen,
      attendanceStartedAt: currentSession.attendanceStartedAt,
      attendanceEndedAt: currentSession.attendanceEndedAt,
      quorum: currentSession.quorum,
      attendances: attendanceData,
      presentCount: attendances.filter(a => a.isPresent).length,
      totalCount: attendances.length,
      hasQuorum: attendances.filter(a => a.isPresent).length >= currentSession.quorum
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Erro ao buscar lista de presença:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função mock para gerar partidos dos vereadores
function getPartyMock(fullName: string) {
  const parties = ['PSD', 'MDB', 'PP', 'PSDB', 'PT', 'PDT', 'REPUBLICANOS', 'PSL', 'CIDADANIA', 'PSB', 'PODE', 'PL', 'SOLIDARIEDADE'];
  const hash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return parties[hash % parties.length];
}

