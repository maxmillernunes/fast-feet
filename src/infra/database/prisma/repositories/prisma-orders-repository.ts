import { Injectable } from '@nestjs/common'
import { OrdersRepository } from '@/domain/logistics/application/repositories/orders-repository'
import type { FindManyNearbyOrdersParams } from '@/domain/logistics/application/repositories/orders-repository'
import { PrismaService } from '../prisma.service'
import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { Order } from '@/domain/logistics/enterprise/entities/order'
import type { OrderWithRecipient } from '@/domain/logistics/enterprise/entities/values-objects/order-with-recipient'
import type { StatusOptions } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import { PrismaOrderMapper } from '../mappers/prisma-order-mapper'
import { PrismaOrderWithRecipientMapper } from '../mappers/prisma-order-with-recipient'
import { DomainEvents } from '@/core/events/domain-events'

@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    })

    if (!order) {
      return null
    }

    return PrismaOrderMapper.toDomain(order)
  }

  async findByIdWithRecipient(id: string): Promise<OrderWithRecipient | null> {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        recipient: true,
      },
    })

    if (!order) {
      return null
    }

    return PrismaOrderWithRecipientMapper.toDomainWithRecipient(order)
  }

  async findManyRecent(params: PaginationParams): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    })

    return orders.map((order) => PrismaOrderMapper.toDomain(order))
  }

  async findManyNearby({
    latitude,
    longitude,
  }: FindManyNearbyOrdersParams): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['CREATED', 'WAITING'],
        },
        deletedAt: null,
      },
      include: {
        recipient: true,
      },
    })

    const nearbyOrders = orders.filter((order) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        order.recipient.latitude,
        order.recipient.longitude,
      )

      return distance <= 10
    })

    return nearbyOrders.map((order) => PrismaOrderMapper.toDomain(order))
  }

  async findManyByDriver(
    driverId: string,
    status: StatusOptions[],
    params: PaginationParams,
  ): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        deliveryDriveId: driverId,
        deletedAt: null,
        status: {
          in: status,
        },
      },
      orderBy: {
        pickedAt: 'desc',
      },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    })

    return orders.map((order) => PrismaOrderMapper.toDomain(order))
  }

  async findOrdersByRecipientId(
    recipientId: string,
    params: PaginationParams,
  ): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        recipientId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    })

    return orders.map((order) => PrismaOrderMapper.toDomain(order))
  }

  async create(order: Order): Promise<void> {
    const data = PrismaOrderMapper.toPrisma(order)

    await this.prisma.order.create({ data })

    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async save(order: Order): Promise<void> {
    const data = PrismaOrderMapper.toPrisma(order)

    await this.prisma.order.update({
      where: {
        id: data.id,
      },
      data,
    })

    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async delete(order: Order): Promise<void> {
    await this.prisma.order.update({
      where: {
        id: order.id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180
  }
}
