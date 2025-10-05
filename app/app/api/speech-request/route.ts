
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Listar solicitações de fala
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    let speechRequests;
    
    if (sessionId) {
      speechRequests = await prisma.speechRequest.findMany({
        where: { sessionId },
        include: {
          user: {
            select: { id: true, fullName: true }
          },
          legislativeProcesses: true
        },
        orderBy: { orderIndex: 'asc' }
      });
    } else {
      // Buscar da sessão atual ativa
      const currentSession = await prisma.votingSession.findFirst({
        where: {
          status: {
            in: ['PEQUENO_EXPEDIENTE', 'GRANDE_EXPEDIENTE', 'ORDEM_DO_DIA', 'CONSIDERACOES_FINAIS', 'TRIBUNA_LIVE']
          }
        }
      });

      if (!currentSession) {
        return NextResponse.json([]);
      }

      speechRequests = await prisma.speechRequest.findMany({
        where: { sessionId: currentSession.id },
        include: {
          user: {
            select: { id: true, fullName: true }
          },
          legislativeProcesses: true
        },
        orderBy: { orderIndex: 'asc' }
      });
    }

    return NextResponse.json(speechRequests);
  } catch (error) {
    console.error('Erro ao buscar solicitações de fala:', error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Criar nova solicitação de fala
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, type, userId } = body;

    // Buscar sessão atual ativa
    const currentSession = await prisma.votingSession.findFirst({
      where: {
        status: {
          in: ['PEQUENO_EXPEDIENTE', 'GRANDE_EXPEDIENTE', 'ORDEM_DO_DIA', 'CONSIDERACOES_FINAIS', 'TRIBUNA_LIVE']
        }
      }
    });

    if (!currentSession) {
      return NextResponse.json({ error: "Nenhuma sessão ativa encontrada" }, { status: 400 });
    }

    // Verificar se o usuário já tem uma solicitação pendente
    const existingRequest = await prisma.speechRequest.findFirst({
      where: {
        sessionId: currentSession.id,
        userId: userId || session.user.id,
        type: type || 'CONSIDERACOES_FINAIS'
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Você já possui uma solicitação de fala nesta sessão" }, { status: 400 });
    }

    // Obter próximo orderIndex
    const lastRequest = await prisma.speechRequest.findFirst({
      where: { sessionId: currentSession.id },
      orderBy: { orderIndex: 'desc' }
    });

    const speechRequest = await prisma.speechRequest.create({
      data: {
        sessionId: currentSession.id,
        userId: userId || session.user.id,
        subject,
        type: type || 'CONSIDERACOES_FINAIS',
        orderIndex: (lastRequest?.orderIndex || 0) + 1,
        isApproved: session.user.role === 'ADMIN' // Admin aprova automaticamente
      },
      include: {
        user: {
          select: { id: true, fullName: true }
        }
      }
    });

    return NextResponse.json(speechRequest);
  } catch (error) {
    console.error('Erro ao criar solicitação de fala:', error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
