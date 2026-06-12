import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramAccountRole } from '@prisma/client';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { RPCError } from 'telegram/errors';
import { PrismaService } from '../prisma/prisma.service';
import { AuthStepResult, PendingAuthState } from './types/auth-state.interface';

@Injectable()
export class TelegramManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramManagerService.name);

  private readonly clients = new Map<string, TelegramClient>();
  private readonly pendingAuth = new Map<string, PendingAuthState>();

  private readonly apiId: number;
  private readonly apiHash: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiId = this.config.get<string>('TELEGRAM_API_ID');
    const apiHash = this.config.get<string>('TELEGRAM_API_HASH');

    if (!apiId || !apiHash) {
      throw new Error(
        'TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in environment',
      );
    }

    this.apiId = Number(apiId);
    this.apiHash = apiHash;
  }

  async onModuleInit() {
    await this.initActiveClients();
  }

  async onModuleDestroy() {
    await this.disconnectAll();
  }

  getClient(accountId: string): TelegramClient | undefined {
    return this.clients.get(accountId);
  }

  getActiveClientIds(): string[] {
    return [...this.clients.keys()];
  }

  /** Шаг 1: привязка Hub Telegram Account */
  async startHubAuth(phone: string, userId: string): Promise<AuthStepResult> {
    const normalizedPhone = this.normalizePhone(phone);

    if (this.pendingAuth.has(normalizedPhone)) {
      await this.cleanupPendingAuth(normalizedPhone);
    }

    const client = this.createClient('');
    await client.connect();

    const sendCodeResult = await client.sendCode(
      { apiId: this.apiId, apiHash: this.apiHash },
      normalizedPhone,
    );

    this.pendingAuth.set(normalizedPhone, {
      client,
      phone: normalizedPhone,
      phoneCodeHash: sendCodeResult.phoneCodeHash,
      userId,
    });

    this.logger.log(`Hub auth code sent to ${normalizedPhone}`);

    return { step: 'code_sent', phone: normalizedPhone };
  }

  async submitCode(
    phone: string,
    code: string,
    userId: string,
  ): Promise<AuthStepResult> {
    const normalizedPhone = this.normalizePhone(phone);
    const pending = this.pendingAuth.get(normalizedPhone);

    if (!pending) {
      throw new BadRequestException(
        'No pending auth session for this phone. Call /auth/start first.',
      );
    }

    if (pending.userId !== userId) {
      throw new UnauthorizedException('Auth session belongs to another user');
    }

    const { client, phoneCodeHash } = pending;

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: normalizedPhone,
          phoneCodeHash,
          phoneCode: code,
        }),
      );
    } catch (error) {
      if (this.isPasswordNeeded(error)) {
        return { step: 'password_required', phone: normalizedPhone };
      }
      throw this.wrapTelegramError(error);
    }

    return this.finalizeHubAuth(normalizedPhone, client, userId);
  }

  async submitPassword(
    phone: string,
    password: string,
    userId: string,
  ): Promise<AuthStepResult> {
    const normalizedPhone = this.normalizePhone(phone);
    const pending = this.pendingAuth.get(normalizedPhone);

    if (!pending) {
      throw new BadRequestException(
        'No pending auth session for this phone. Call /auth/start first.',
      );
    }

    if (pending.userId !== userId) {
      throw new UnauthorizedException('Auth session belongs to another user');
    }

    const { client } = pending;

    try {
      await client.signInWithPassword(
        { apiId: this.apiId, apiHash: this.apiHash },
        {
          password: async () => password,
          onError: (err) => this.logger.error(err),
        },
      );
    } catch (error) {
      throw this.wrapTelegramError(error);
    }

    return this.finalizeHubAuth(normalizedPhone, client, userId);
  }

  async reconnectAccount(accountId: string): Promise<void> {
    const account = await this.prisma.telegramAccount.findUnique({
      where: { id: accountId },
    });

    if (!account?.sessionString || account.role !== TelegramAccountRole.HUB) {
      throw new NotFoundException(`Hub account ${accountId} not found`);
    }

    await this.disconnectClient(accountId);
    await this.connectAccount(account);
  }

  private async initActiveClients() {
    const accounts = await this.prisma.telegramAccount.findMany({
      where: {
        isActive: true,
        role: TelegramAccountRole.HUB,
        sessionString: { not: null },
      },
    });

    this.logger.log(`Initializing ${accounts.length} Hub account(s)`);

    for (const account of accounts) {
      try {
        await this.connectAccount(account);
      } catch (error) {
        this.logger.error(
          `Failed to connect hub ${account.phone} (${account.id})`,
          error,
        );
        await this.prisma.telegramAccount.update({
          where: { id: account.id },
          data: { isActive: false },
        });
      }
    }
  }

  private async connectAccount(account: {
    id: string;
    phone: string | null;
    sessionString: string | null;
  }) {
    if (!account.sessionString) {
      throw new UnauthorizedException('Hub account has no session');
    }

    const client = this.createClient(account.sessionString);
    await client.connect();

    if (!(await client.isUserAuthorized())) {
      throw new UnauthorizedException(
        `Session expired for hub ${account.phone}`,
      );
    }

    this.clients.set(account.id, client);
    this.logger.log(`Connected Hub client for ${account.phone}`);
  }

  private async finalizeHubAuth(
    phone: string,
    client: TelegramClient,
    userId: string,
  ): Promise<AuthStepResult> {
    const sessionString = (client.session as StringSession).save();

    const existingHub = await this.prisma.telegramAccount.findFirst({
      where: { userId, role: TelegramAccountRole.HUB },
    });

    const account = existingHub
      ? await this.prisma.telegramAccount.update({
          where: { id: existingHub.id },
          data: {
            phone,
            sessionString,
            isActive: true,
            hubDetachedAt: null,
          },
        })
      : await this.prisma.telegramAccount.create({
          data: {
            role: TelegramAccountRole.HUB,
            phone,
            sessionString,
            isActive: true,
            userId,
          },
        });

    this.clients.set(account.id, client);
    this.pendingAuth.delete(phone);

    this.logger.log(`Hub authorized: ${phone} (${account.id})`);

    return {
      step: 'authorized',
      accountId: account.id,
      phone,
      role: 'HUB',
    };
  }

  private createClient(sessionString: string): TelegramClient {
    return new TelegramClient(
      new StringSession(sessionString),
      this.apiId,
      this.apiHash,
      { connectionRetries: 5, useWSS: false },
    );
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\s/g, '');
  }

  private isPasswordNeeded(error: unknown): boolean {
    if (error instanceof RPCError) {
      return error.errorMessage === 'SESSION_PASSWORD_NEEDED';
    }
    return false;
  }

  private wrapTelegramError(error: unknown): Error {
    if (error instanceof RPCError) {
      return new BadRequestException(
        `Telegram API error: ${error.errorMessage}`,
      );
    }
    if (error instanceof Error) {
      return new BadRequestException(error.message);
    }
    return new BadRequestException('Unknown Telegram error');
  }

  private async cleanupPendingAuth(phone: string) {
    const pending = this.pendingAuth.get(phone);
    if (pending) {
      try {
        await pending.client.disconnect();
      } catch {
        // ignore
      }
      this.pendingAuth.delete(phone);
    }
  }

  private async disconnectClient(accountId: string) {
    const client = this.clients.get(accountId);
    if (client) {
      try {
        await client.disconnect();
      } catch {
        // ignore
      }
      this.clients.delete(accountId);
    }
  }

  private async disconnectAll() {
    for (const phone of this.pendingAuth.keys()) {
      await this.cleanupPendingAuth(phone);
    }
    for (const accountId of this.clients.keys()) {
      await this.disconnectClient(accountId);
    }
  }
}
