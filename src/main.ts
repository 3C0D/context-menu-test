//"verbatimModuleSyntax": true ds tsconfig.json

import {
  Plugin,
  TFolder
} from "obsidian";
import { around } from "monkey-around";
import {  InternalPluginName, type FileExplorerView, type InternalPlugin } from "obsidian-typings";


declare module "obsidian" {
  interface InternalPlugin {
    enable(): Promise<void>;
  }
}

export default class FolderContextMenu extends Plugin {
  fileExplorerView: FileExplorerView;
  fileExplorerPlugin: InternalPlugin;

  onload(): void {
    console.log("totot")
    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
  }

  async onLayoutReady(): Promise<void> {
    const fileExplorerPluginInstance = this.app.internalPlugins.getEnabledPluginById(InternalPluginName.FileExplorer);
    console.log("fileExplorerPluginInstance", fileExplorerPluginInstance)

    if (!fileExplorerPluginInstance) {
      return;
    }

    this.fileExplorerView = this.app.workspace.getLeavesOfType('file-explorer')[0].view;

    this.register(openFileContextMenuWrapper(this));

    this.addVaultSwitcherContextMenu();

  }

  private addVaultSwitcherContextMenu() {
    const vaultSwitcherEl = document.querySelector('.workspace-drawer-vault-switcher') as HTMLElement;
    if (vaultSwitcherEl) {
      this.fileExplorerView.files.set(vaultSwitcherEl, this.app.vault.getRoot());
      this.registerDomEvent(vaultSwitcherEl, 'contextmenu', (event: MouseEvent) => {
        event.preventDefault();
        this.fileExplorerView.openFileContextMenu(event, vaultSwitcherEl.childNodes[0] as HTMLElement);
      });
    }
  }
}

export function getPrototypeOf<T>(instance: T): T {
  return Object.getPrototypeOf(instance) as T;
}

//event: Event, fileItemEl: HTMLElement
// type FileExplorerView = 
function openFileContextMenuWrapper(plugin: FolderContextMenu) {
  const viewPrototype = Object.getPrototypeOf(plugin.fileExplorerView);
  return around(viewPrototype, {
    openFileContextMenu(old:any) {
      // return function (event: Event, fileItemEl: HTMLElement): void {
      return function (...args: [event: Event, fileItemEl: HTMLElement]): void {
        const file = this.files.get(args[1].parentElement);
        if (!file) return
        if (!file.isRoot() || !(file instanceof TFolder)) {
          old.apply(args);
          return;
        }
        console.log("icicicci")
        // Temporairement faire croire que ce n'est pas le dossier racine
        const originalIsRoot = file.isRoot;
        file.isRoot = () => false;
        old.apply(args);
        file.isRoot = originalIsRoot;
      }
    }
  })
}