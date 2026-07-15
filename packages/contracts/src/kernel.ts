import { IAppService } from './lifecycle';

export interface IContainer {
  register<T>(name: string, instance: T): void;
  registerFactory<T>(name: string, factory: (container: IContainer) => T): void;
  resolve<T>(name: string): T;
  has(name: string): boolean;
  clear(): void;
}

export interface IServiceRegistry extends IAppService {
  register(name: string, service: IAppService): void;
  resolve(name: string): IAppService;
  listServices(): string[];
}

export interface IKernel extends IAppService {
  getContainer(): IContainer;
  getServiceRegistry(): IServiceRegistry;
}
