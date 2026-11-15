import * as vscode from 'vscode';

const ICON_THEME_IDS = ['plum-icons', 'plum-icons-material'];
const PROMPT_DISMISSED_KEY = 'plum.iconThemePromptDismissed';

export function activate(context: vscode.ExtensionContext) {
    console.log('Plum language extension is now active!');

    let disposable = vscode.commands.registerCommand('plum.runFile', () => {
        vscode.window.showInformationMessage('Running Plum file...');
        // Later: Integrate with your Python interpreter
    });

    context.subscriptions.push(disposable);

    maybePromptForIconTheme(context);
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

export function deactivate() {}