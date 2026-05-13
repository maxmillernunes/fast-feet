import { Injectable } from '@nestjs/common'
import { RecipientsRepository } from '@/domain/logistics/application/repositories/recipients-repository'
import { PrismaService } from '../prisma.service'
import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { Recipient } from '@/domain/logistics/enterprise/entities/recipient'
import { PrismaRecipientMapper } from '../mappers/prisma-recipient-mapper'

@Injectable()
export class PrismaRecipientsRepository implements RecipientsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Recipient | null> {
    const recipient = await this.prisma.recipient.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    })

    if (!recipient) {
      return null
    }

    return PrismaRecipientMapper.toDomain(recipient)
  }

  async findByDocument(document: string): Promise<Recipient | null> {
    const recipient = await this.prisma.recipient.findUnique({
      where: {
        document,
        deletedAt: null,
      },
    })

    if (!recipient) {
      return null
    }

    return PrismaRecipientMapper.toDomain(recipient)
  }

  async findMany(params: PaginationParams): Promise<Recipient[]> {
    const recipients = await this.prisma.recipient.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    })

    return recipients.map((recipient) =>
      PrismaRecipientMapper.toDomain(recipient),
    )
  }

  async create(recipient: Recipient): Promise<void> {
    const data = PrismaRecipientMapper.toPrisma(recipient)

    await this.prisma.recipient.create({ data })
  }

  async save(recipient: Recipient): Promise<void> {
    const data = PrismaRecipientMapper.toPrisma(recipient)

    await this.prisma.recipient.update({
      where: {
        id: data.id,
      },
      data,
    })
  }

  async delete(recipient: Recipient): Promise<void> {
    await this.prisma.recipient.update({
      where: {
        id: recipient.id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }
}
