import { ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { CommandHandler } from "@nestjs/cqrs";

export class ConnectToPairCommand {
    constructor(
        userId: string
    ) { }
}

@Injectable()
@CommandHandler(ConnectToPairCommand)
export class ConnectToPairUseCase implements ICommandHandler<ConnectToPairCommand> {
    constructor(

    ) { }

    execute(command: ConnectToPairCommand): Promise<any> {

    }
}