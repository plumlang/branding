import { execFile } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';

const ICON_THEME_IDS = ['plum-icons', 'plum-icons-material'];
const PROMPT_DISMISSED_KEY = 'plum.iconThemePromptDismissed';
const INSTALL_URL = 'https://plum.elixpo.com/docs/install/';

let client: LanguageClient | undefined;
let output: vscode.OutputChannel | undefined;
/* The `plum` path we already said was missing, so the message shows once. */
let reportedMissing: string | undefined;

export function activate(context: vscode.ExtensionContext) {
    output = vscode.window.createOutputChannel('Plumlang');
    context.subscriptions.push(output);

    context.subscriptions.push(
        vscode.commands.registerCommand('plum.runFile', (uri?: vscode.Uri) => runFile(uri)),
        vscode.commands.registerCommand('plum.restartServer', async () => {
            reportedMissing = undefined;
            await stopClient();
            await startClient();
        }),
        vscode.workspace.onDidChangeConfiguration(async (event) => {
            if (event.affectsConfiguration('plum.path') || event.affectsConfiguration('plum.lsp.enabled')) {
                reportedMissing = undefined;
                await stopClient();
                await startClient();
            }
        })
    );

    void startClient();
    maybePromptForIconTheme(context);
}

export function deactivate(): Thenable<void> | undefined {
    return stopClient();
}

/* The `plum` binary: the plum.path setting, or `plum` on PATH. */
function plumPath(): string {
    const configured = vscode.workspace.getConfiguration('plum').get<string>('path', 'plum').trim();
    return configured === '' ? 'plum' : configured;
}

/* Does `plum version` run? Resolves to an error message, or undefined. */
function checkPlum(command: string): Promise<string | undefined> {
    return new Promise((resolve) => {
        execFile(command, ['version'], { timeout: 10000 }, (error, stdout) => {
            if (error === null) {
                output?.appendLine(`Using ${stdout.trim()} (${command})`);
                resolve(undefined);
            } else if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                resolve(`Plumlang: \`${command}\` was not found, so the language features are off. ` +
                    'Install Plumlang, or set plum.path to where plum is.');
            } else {
                resolve(`Plumlang: \`${command} version\` failed: ${error.message}`);
            }
        });
    });
}

async function reportMissing(command: string, message: string) {
    if (reportedMissing === command) {
        return;
    }
    reportedMissing = command;
    output?.appendLine(message);
    const choice = await vscode.window.showErrorMessage(message, 'Install Plumlang', 'Open Settings');
    if (choice === 'Install Plumlang') {
        await vscode.env.openExternal(vscode.Uri.parse(INSTALL_URL));
    } else if (choice === 'Open Settings') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'plum.path');
    }
}

async function startClient() {
    if (client !== undefined) {
        return;
    }
    if (!vscode.workspace.getConfiguration('plum').get<boolean>('lsp.enabled', true)) {
        output?.appendLine('The language server is off (plum.lsp.enabled).');
        return;
    }
    const command = plumPath();
    const problem = await checkPlum(command);
    if (problem !== undefined) {
        await reportMissing(command, problem);
        return;
    }
    const serverOptions: ServerOptions = { command, args: ['lsp'] };
    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'plum' },
            { scheme: 'untitled', language: 'plum' },
        ],
        outputChannel: output,
    };
    const started = new LanguageClient('plum', 'Plumlang', serverOptions, clientOptions);
    client = started;
    try {
        await started.start();
    } catch (error) {
        client = undefined;
        const message = error instanceof Error ? error.message : String(error);
        output?.appendLine(`The language server didn't start: ${message}`);
        void vscode.window.showErrorMessage(`Plumlang: the language server didn't start: ${message}`);
    }
}

async function stopClient(): Promise<void> {
    const running = client;
    client = undefined;
    if (running !== undefined) {
        try {
            await running.stop();
        } catch {
            /* it may already have stopped */
        }
    }
}

/* Plum: Run File: `plum run <file>` in a terminal, after saving the file. */
async function runFile(uri?: vscode.Uri) {
    let document: vscode.TextDocument | undefined;
    if (uri !== undefined) {
        document = await vscode.workspace.openTextDocument(uri);
    } else {
        document = vscode.window.activeTextEditor?.document;
    }
    if (document === undefined || document.languageId !== 'plum') {
        void vscode.window.showWarningMessage('Plumlang: open a .plum file to run it.');
        return;
    }
    if (document.isUntitled) {
        void vscode.window.showWarningMessage('Plumlang: save the file before running it.');
        return;
    }
    if (document.isDirty && !(await document.save())) {
        return;
    }
    const command = plumPath();
    const problem = await checkPlum(command);
    if (problem !== undefined) {
        reportedMissing = undefined; /* the user asked: say it again */
        await reportMissing(command, problem);
        return;
    }
    const file = document.uri.fsPath;
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    /* A process, not a shell line: no quoting to get wrong in any shell. */
    const execution = new vscode.ProcessExecution(command, ['run', file], { cwd: path.dirname(file) });
    const task = new vscode.Task(
        { type: 'plum', file },
        folder ?? vscode.TaskScope.Workspace,
        `run ${path.basename(file)}`,
        'plum',
        execution
    );
    task.presentationOptions = {
        reveal: vscode.TaskRevealKind.Always,
        panel: vscode.TaskPanelKind.Dedicated,
        clear: true,
        focus: false,
    };
    await vscode.tasks.executeTask(task);
}

function maybePromptForIconTheme(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration();
    const activeIconTheme = config.get<string>('workbench.iconTheme');
    const alreadyDismissed = context.globalState.get<boolean>(PROMPT_DISMISSED_KEY, false);

    if (activeIconTheme && ICON_THEME_IDS.includes(activeIconTheme)) {
        return;
    }
    if (alreadyDismissed) {
        return;
    }

    vscode.window
        .showInformationMessage(
            'Use the Plum file icon for .plum files?',
            'Enable (Seti-based)',
            'Enable (Material-based)',
            "Don't ask again"
        )
        .then((choice) => {
            if (choice === 'Enable (Seti-based)') {
                config.update('workbench.iconTheme', 'plum-icons', vscode.ConfigurationTarget.Global);
            } else if (choice === 'Enable (Material-based)') {
                config.update('workbench.iconTheme', 'plum-icons-material', vscode.ConfigurationTarget.Global);
            } else if (choice === "Don't ask again") {
                context.globalState.update(PROMPT_DISMISSED_KEY, true);
            }
        });
}
