import { Container } from './deps.ts';
import { TYPES } from './src/core/types.ts';
import type { ICommand } from './src/core/commands/ICommand.ts';
import type { ICliService } from './src/core/services/cli/ICliService.ts';
import type { IConfigService } from './src/core/services/config/IConfigService.ts';
import type { IFileDiscoverer } from './src/components/flattener/interfaces/IFileDiscoverer.ts';
import { FlattenerCommand } from './src/components/flattener/flattener.command.ts';
import { FileDiscoverer } from './src/components/flattener/services/FileDiscoverer.ts';
import { ConfigService } from './src/core/services/config/ConfigService.ts';
import { CliService } from './src/core/services/cli/CliService.ts';

const container = new Container();

// Register services
container.bind<IConfigService>(TYPES.IConfigService).to(ConfigService).inSingletonScope();
container.bind<IFileDiscoverer>(TYPES.IFileDiscoverer).to(FileDiscoverer).inTransientScope();
container.bind<ICliService>(TYPES.ICliService).to(CliService).inSingletonScope();

// Register commands
container.bind<ICommand>(TYPES.ICommand).to(FlattenerCommand).inSingletonScope();

export { container };
