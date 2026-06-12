import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TelegramAccountRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAccountOwnership(userId: string, accountId: string) {
    const account = await this.prisma.telegramAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    return account;
  }

  async assertChatAccountOwnership(userId: string, accountId: string) {
    const account = await this.assertAccountOwnership(userId, accountId);
    if (account.role !== TelegramAccountRole.CHAT) {
      throw new BadRequestException(
        'Chat forks can only be created on Chat Accounts',
      );
    }
    return account;
  }

  async assertHubOwnership(userId: string, accountId: string) {
    const account = await this.assertAccountOwnership(userId, accountId);
    if (account.role !== TelegramAccountRole.HUB) {
      throw new BadRequestException('This operation requires a Hub account');
    }
    return account;
  }

  async getHubAccount(userId: string) {
    return this.prisma.telegramAccount.findFirst({
      where: { userId, role: TelegramAccountRole.HUB },
    });
  }

  async assertForkOwnership(userId: string, forkId: string) {
    const fork = await this.prisma.chatFork.findFirst({
      where: { id: forkId, account: { userId } },
    });

    if (!fork) {
      throw new NotFoundException(`Chat fork ${forkId} not found`);
    }

    return fork;
  }

  /** GramJS client id: Hub itself or linked Hub for HUB_CLONE chat accounts */
  async resolveTelegramClientAccountId(accountId: string): Promise<string | null> {
    const account = await this.prisma.telegramAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) return null;

    if (account.role === TelegramAccountRole.HUB) {
      return account.isActive ? account.id : null;
    }

    if (account.hubDetachedAt || !account.hubSourceId) {
      return null;
    }

    const hub = await this.prisma.telegramAccount.findFirst({
      where: {
        id: account.hubSourceId,
        role: TelegramAccountRole.HUB,
        isActive: true,
      },
    });

    return hub?.id ?? null;
  }
}
